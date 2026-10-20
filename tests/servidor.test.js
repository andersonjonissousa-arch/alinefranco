// Testa o servidor (configuração, banco e API) com os serviços do Google simulados em memória.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { criarGoogleFalso } = require('./apoio/googleFalso');

function carregarSistema(opcoes) {
  const google = criarGoogleFalso(opcoes);
  const ctx = vm.createContext(Object.assign({}, google.globais));
  const pasta = path.join(__dirname, '..', 'src');
  for (const arquivo of fs.readdirSync(pasta).filter((f) => f.endsWith('.js'))) {
    vm.runInContext(fs.readFileSync(path.join(pasta, arquivo), 'utf8'), ctx, { filename: arquivo });
  }
  // O cache de leitura vale por execução no Apps Script; aqui limpamos entre chamadas.
  ctx.novaExecucao = () => vm.runInContext('_cacheTabelas = {}', ctx);
  return { ctx, google };
}

test('configurar cria as abas, semeia dados e pode rodar de novo sem duplicar', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();
  ctx.configurar();
  ctx.novaExecucao();

  const nomes = google.planilha.getSheets().map((a) => a.getName());
  assert.deepEqual(nomes.sort(), Object.keys(ctx.TABELAS).sort());
  assert.equal(ctx.listar('SETORES').length, ctx.SETORES_INICIAIS.length);
  assert.equal(ctx.listar('UNIDADES').length, 18);
  assert.equal(ctx.listar('LISTAS').filter((i) => i.lista === 'DESFECHO').length, 6);
  const profs = ctx.listar('PROFISSIONAIS');
  assert.equal(profs.length, 1);
  assert.equal(profs[0].perfil, 'COORDENAÇÃO');
});

test('apiInicio identifica o usuário e bloqueia e-mail sem cadastro', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();

  const r = ctx.apiInicio();
  assert.equal(r.ok, true);
  assert.equal(r.dados.usuario.email, 'coordenacao@exemplo.com');
  assert.ok(r.dados.listas.TIPO_SOLICITACAO.length > 0);
  assert.equal(r.dados.unidades[0].setor, 'CLÍNICA PEDIÁTRICA');

  google.sessao.email = 'estranho@exemplo.com';
  ctx.novaExecucao();
  const negado = ctx.apiInicio();
  assert.equal(negado.ok, false);
  assert.match(negado.erro, /não tem acesso/);
});

test('pacientes: cadastro, busca e bloqueio de prontuário duplicado', () => {
  const { ctx } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();

  const salvo = ctx.apiSalvarPaciente({ prontuario: '152429.0', nome: '  josé pedro de souza ' });
  assert.equal(salvo.ok, true);
  assert.equal(salvo.dados.prontuario, '152429');
  assert.equal(salvo.dados.nome, 'JOSÉ PEDRO DE SOUZA');

  ctx.novaExecucao();
  const dup = ctx.apiSalvarPaciente({ prontuario: '152429', nome: 'Outro' });
  assert.equal(dup.ok, false);
  assert.match(dup.erro, /Já existe paciente/);

  ctx.novaExecucao();
  const busca = ctx.apiBuscarPacientes('jose');
  assert.equal(busca.dados.length, 1);

  ctx.novaExecucao();
  const editado = ctx.apiSalvarPaciente({ id: salvo.dados.id, prontuario: '152429', nome: 'José Pedro de Souza Santos' });
  assert.equal(editado.ok, true);
  ctx.novaExecucao();
  assert.equal(ctx.listar('PACIENTES').length, 1);
  assert.equal(ctx.listar('PACIENTES')[0].nome, 'JOSÉ PEDRO DE SOUZA SANTOS');
});

test('cadastros exigem coordenação e validam e-mail', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();

  const invalido = ctx.apiSalvarProfissional({ nome: 'Elane', email: 'elane', categoria: 'PSICÓLOGA', perfil: 'PROFISSIONAL' });
  assert.equal(invalido.ok, false);

  ctx.novaExecucao();
  const ok = ctx.apiSalvarProfissional({ nome: 'Elane', email: 'Elane@Exemplo.com', categoria: 'PSICÓLOGA', perfil: 'PROFISSIONAL' });
  assert.equal(ok.ok, true);
  assert.equal(ok.dados.profissionais.length, 2);

  google.sessao.email = 'elane@exemplo.com';
  ctx.novaExecucao();
  const negado = ctx.apiSalvarSetor({ nome: 'NOVO' });
  assert.equal(negado.ok, false);
  assert.match(negado.erro, /Somente a coordenação/);
});
