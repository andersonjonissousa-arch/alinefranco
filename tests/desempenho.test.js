const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { criarGoogleFalso } = require('./apoio/googleFalso');

function sistema() {
  const google = criarGoogleFalso();
  const entradas = new Map();
  let indisponivel = false;
  google.globais.CacheService = { getScriptCache: () => ({
    get: k => { if (indisponivel) throw Error('Sem cache'); return entradas.get(k) || null; },
    put: (k, v, ttl) => { assert.equal(ttl, 120); entradas.set(k, v); }
  }) };
  const ctx = vm.createContext(google.globais);
  const pasta = path.join(__dirname, '..', 'src');
  for (const nome of fs.readdirSync(pasta).filter(n => n.endsWith('.js'))) {
    vm.runInContext(fs.readFileSync(path.join(pasta, nome), 'utf8'), ctx);
  }
  ctx.configurar();
  const leituras = {};
  let travas = 0;
  for (const aba of google.planilha.getSheets()) {
    const getRange = aba.getRange.bind(aba);
    aba.getRange = (...args) => {
      const intervalo = getRange(...args);
      const getValues = intervalo.getValues.bind(intervalo);
      intervalo.getValues = () => { leituras[aba.nome] = (leituras[aba.nome] || 0) + 1; return getValues(); };
      return intervalo;
    };
  }
  ctx.LockService = { getScriptLock: () => ({ waitLock() { travas++; }, releaseLock() {} }) };
  function nova() {
    ctx._cacheTabelas = {};
    for (const k of Object.keys(leituras)) delete leituras[k];
    travas = 0;
  }
  nova();
  return { ctx, google, entradas, leituras, nova, travas: () => travas,
    falharCache: () => { indisponivel = true; } };
}

test('abertura inclui painel atualizado e reaproveita leituras na mesma execução', () => {
  const s = sistema();
  const resposta = s.ctx.apiInicio(true);
  assert.equal(resposta.ok, true, resposta.erro);
  assert.equal(resposta.dados.painel.resumo.pacientes, 0);
  assert.equal(s.leituras.PROFISSIONAIS, 1);
  assert.equal(s.leituras.UNIDADES, 1);
  assert.equal(s.travas(), 0, 'Leitura normal não disputa trava de gravação');
  s.nova();
  assert.deepEqual(JSON.parse(JSON.stringify(s.ctx.apiGestao({}).dados)),
    JSON.parse(JSON.stringify(resposta.dados.painel)));
  assert.equal(s.travas(), 0);
});

test('cache evita releitura das opções, mas permissões e dados clínicos continuam frescos', () => {
  const s = sistema();
  assert.equal(s.ctx.apiInicio().ok, true);
  s.nova();
  assert.equal(s.ctx.apiInicio().ok, true);
  assert.equal(s.leituras.UNIDADES, undefined);
  assert.equal(s.leituras.PROFISSIONAIS, 1, 'Autorização nunca usa cache persistente');
  s.nova();
  s.ctx.listar('UNIDADES');
  assert.equal(s.leituras.UNIDADES, 1, 'Validação clínica continua lendo a planilha');
  const prof = s.ctx.listar('PROFISSIONAIS')[0];
  // Alteração direta da planilha também precisa bloquear mesmo com cache preenchido.
  const aba = s.google.planilha.getSheetByName('PROFISSIONAIS');
  aba.linhas[1][s.ctx.TABELAS.PROFISSIONAIS.indexOf('ativo')] = 'NÃO';
  s.nova();
  assert.equal(s.ctx.apiInicio(true).ok, false);
  assert.ok(prof.id);
});

test('gravações invalidam opções imediatamente; cache ausente não impede abertura', () => {
  const s = sistema();
  const inicial = s.ctx.apiInicio().dados;
  const unidade = inicial.unidades[0];
  s.nova();
  const salvo = s.ctx.apiSalvarUnidade({ ...unidade, nome: 'UNIDADE ALTERADA' });
  assert.equal(salvo.ok, true, salvo.erro);
  s.nova();
  assert.equal(s.ctx.apiInicio().dados.unidades.find(u => u.id === unidade.id).nome, 'UNIDADE ALTERADA');
  s.falharCache();
  s.nova();
  assert.equal(s.ctx.apiInicio(true).ok, true);
  assert.equal(s.leituras.UNIDADES, 1);
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
