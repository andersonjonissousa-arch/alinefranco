const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { criarGoogleFalso } = require('./apoio/googleFalso');

function sistema() {
  const google = criarGoogleFalso();
  const ctx = vm.createContext(google.globais);
  const pasta = path.join(__dirname, '..', 'src');
  for (const nome of fs.readdirSync(pasta).filter(n => n.endsWith('.js'))) {
    vm.runInContext(fs.readFileSync(path.join(pasta, nome), 'utf8'), ctx);
  }
  ctx.configurar();
  // Conta as consultas ao banco: pela API (todas as abas de uma vez) e aba por aba (quando a API falha).
  const consultas = { api: 0, abas: {} };
  let travas = 0;
  let apiFalha = false;
  const batchGet = google.globais.Sheets.Spreadsheets.Values.batchGet;
  google.globais.Sheets.Spreadsheets.Values.batchGet = (...a) => {
    if (apiFalha) throw new Error('API desativada');
    consultas.api++;
    return batchGet(...a);
  };
  for (const aba of google.planilha.getSheets()) {
    const getRange = aba.getRange.bind(aba);
    aba.getRange = (...args) => {
      const intervalo = getRange(...args);
      const getValues = intervalo.getValues.bind(intervalo);
      intervalo.getValues = () => { consultas.abas[aba.nome] = (consultas.abas[aba.nome] || 0) + 1; return getValues(); };
      return intervalo;
    };
  }
  ctx.LockService = { getScriptLock: () => ({ waitLock() { travas++; }, releaseLock() {} }) };
  function nova() {
    vm.runInContext('_cacheTabelas = {}; _indicesTabelas = {}; _apiIndisponivel = false;', ctx);
    consultas.api = 0;
    for (const k of Object.keys(consultas.abas)) delete consultas.abas[k];
    travas = 0;
  }
  nova();
  return { ctx, google, consultas, nova, travas: () => travas, falharApi: () => { apiFalha = true; } };
}

test('abertura inclui painel atualizado numa consulta só ao banco, sem disputar a trava de gravação', () => {
  const s = sistema();
  const resposta = s.ctx.apiInicio(true);
  assert.equal(resposta.ok, true, resposta.erro);
  assert.equal(resposta.dados.painel.resumo.pacientes, 0);
  assert.equal(s.consultas.api, 1);
  assert.deepEqual({ ...s.consultas.abas }, {});
  assert.equal(s.travas(), 0, 'Leitura normal não disputa trava de gravação');
  s.nova();
  assert.deepEqual(JSON.parse(JSON.stringify(s.ctx.apiGestao({}).dados)),
    JSON.parse(JSON.stringify(resposta.dados.painel)));
  assert.equal(s.travas(), 0);
});

test('permissões e cadastros são lidos de novo a cada execução', () => {
  const s = sistema();
  assert.equal(s.ctx.apiInicio().ok, true);
  const prof = s.ctx.listar('PROFISSIONAIS')[0];
  // Alteração direta da planilha também precisa bloquear o acesso na execução seguinte.
  const aba = s.google.planilha.getSheetByName('PROFISSIONAIS');
  aba.linhas[1][s.ctx.TABELAS.PROFISSIONAIS.indexOf('ativo')] = 'NÃO';
  s.nova();
  assert.equal(s.ctx.apiInicio(true).ok, false);
  assert.equal(s.consultas.api, 1);
  assert.ok(prof.id);
});

test('gravações aparecem na abertura seguinte; sem a API, a abertura continua funcionando aba por aba', () => {
  const s = sistema();
  const inicial = s.ctx.apiInicio().dados;
  const unidade = inicial.unidades[0];
  s.nova();
  const salvo = s.ctx.apiSalvarUnidade({ ...unidade, nome: 'UNIDADE ALTERADA' });
  assert.equal(salvo.ok, true, salvo.erro);
  s.nova();
  assert.equal(s.ctx.apiInicio().dados.unidades.find(u => u.id === unidade.id).nome, 'UNIDADE ALTERADA');
  s.falharApi();
  s.nova();
  const semApi = s.ctx.apiInicio(true);
  assert.equal(semApi.ok, true, semApi.erro);
  assert.equal(semApi.dados.unidades.find(u => u.id === unidade.id).nome, 'UNIDADE ALTERADA');
  assert.equal(s.consultas.abas.UNIDADES, 1);
});

test('índice de IDs acompanha atualização, exclusão e novas execuções', () => {
  const { ctx, nova } = sistema();
  const p = ctx.inserir('PACIENTES', { nome: 'ANTES', prontuario: '1' });
  assert.equal(ctx.buscarPorId('PACIENTES', p.id).nome, 'ANTES');
  ctx.atualizar('PACIENTES', p.id, { nome: 'DEPOIS' });
  assert.equal(ctx.buscarPorId('PACIENTES', p.id).nome, 'DEPOIS');
  nova();
  assert.equal(ctx.buscarPorId('PACIENTES', p.id).nome, 'DEPOIS');
  ctx.excluir('PACIENTES', p.id);
  assert.equal(ctx.buscarPorId('PACIENTES', p.id), null);
});
