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
  assert.equal(ctx.listar('JUSTIFICATIVAS').length, ctx.JUSTIFICATIVAS_INICIAIS.length);
  assert.equal(ctx.listar('FERIADOS').length, ctx.FERIADOS_NACIONAIS.length);
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

  const invalido = ctx.apiSalvarProfissional({ nome: 'Elane', email: 'elane', categoria: 'PROFISSIONAL DA EMPRESA', perfil: 'PROFISSIONAL' });
  assert.equal(invalido.ok, false);

  ctx.novaExecucao();
  const ok = ctx.apiSalvarProfissional({ nome: 'Elane', email: 'Elane@Exemplo.com', categoria: 'PROFISSIONAL DA EMPRESA', perfil: 'PROFISSIONAL' });
  assert.equal(ok.ok, true);
  assert.equal(ok.dados.profissionais.length, 2);

  google.sessao.email = 'elane@exemplo.com';
  ctx.novaExecucao();
  const negado = ctx.apiSalvarSetor({ nome: 'NOVO' });
  assert.equal(negado.ok, false);
  assert.match(negado.erro, /Somente a coordenação/);
});

function sistemaComCaso() {
  const sis = carregarSistema();
  const { ctx } = sis;
  ctx.configurar();
  ctx.novaExecucao();
  vm.runInContext("hoje = function () { return '2026-10-20'; }", ctx);
  const j = ctx.listar('JUSTIFICATIVAS').find((x) => x.nome === 'POUCOS RECURSOS DE ENFRENTAMENTO');
  ctx.apiSalvarJustificativa({ id: j.id, nome: j.nome, prazo_dias_uteis: '2', ordem: j.ordem });
  ctx.novaExecucao();
  const paciente = ctx.apiSalvarPaciente({ prontuario: '161349', nome: 'Francisca Kelyane' }).dados;
  ctx.novaExecucao();
  const unidade = ctx.listar('UNIDADES').find((u) => u.nome === 'CM 2');
  return { ...sis, j, paciente, unidade };
}

test('caso: abre, calcula tempos e prazo, e impede segundo caso aberto do mesmo paciente', () => {
  const { ctx, j, paciente, unidade } = sistemaComCaso();
  const r1 = ctx.apiSalvarCaso({
    paciente_id: paciente.id, unidade_id: unidade.id, data_admissao: '2026-10-10',
    tipo_solicitacao: 'EQUIPE', data_solicitacao: '2026-10-13', data_avaliacao: '2026-10-14',
    necessidade_acompanhamento: 'PACIENTE E FAMÍLIA', justificativa_id: j.id
  });
  assert.equal(r1.ok, true, r1.erro);
  const caso = r1.dados.caso;
  assert.equal(caso.status, 'ABERTO');
  assert.equal(Number(caso.dias_ate_solicitacao), 3);
  assert.equal(Number(caso.dias_resposta), 1);
  assert.equal(caso.proximo_prazo, '2026-10-16'); // 2 dias úteis após 14/10
  assert.equal(caso.situacao, 'ATRASADO'); // hoje = 20/10
  assert.equal(caso.avaliado_por, ctx.listar('PROFISSIONAIS')[0].id); // quem está logado

  ctx.novaExecucao();
  const r2 = ctx.apiSalvarCaso({ paciente_id: paciente.id, unidade_id: unidade.id, data_solicitacao: '2026-10-15' });
  assert.equal(r2.ok, false);
  assert.match(r2.erro, /já tem um caso aberto/);

  ctx.novaExecucao();
  const semJust = ctx.apiSalvarCaso({ id: caso.id, paciente_id: paciente.id, unidade_id: unidade.id,
    data_solicitacao: '2026-10-13', data_avaliacao: '2026-10-14', necessidade_acompanhamento: 'PACIENTE' });
  assert.equal(semJust.ok, false);
  assert.match(semJust.erro, /justificativa/);
});

test('atendimentos: profissional do login, prazo no/fora, exclusão recalcula, desfecho encerra', () => {
  const { ctx, j, paciente, unidade } = sistemaComCaso();
  const caso = ctx.apiSalvarCaso({
    paciente_id: paciente.id, unidade_id: unidade.id, data_solicitacao: '2026-10-13', data_avaliacao: '2026-10-14',
    necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id
  }).dados.caso;

  ctx.novaExecucao();
  const a1 = ctx.apiRegistrarAtendimento({ caso_id: caso.id, data: '2026-10-16', publico: 'PACIENTE' });
  assert.equal(a1.ok, true, a1.erro);
  const reg = a1.dados.atendimentos[0];
  assert.equal(reg.profissional_id, ctx.listar('PROFISSIONAIS')[0].id);
  assert.equal(reg.categoria, 'PROFISSIONAL DA EMPRESA');
  assert.equal(reg.no_prazo, 'SIM');
  assert.equal(a1.dados.caso.proximo_prazo, '2026-10-20');
  assert.equal(a1.dados.caso.situacao, 'VENCE HOJE');

  ctx.novaExecucao();
  const futuro = ctx.apiRegistrarAtendimento({ caso_id: caso.id, data: '2026-10-21', publico: 'FAMÍLIA' });
  assert.equal(futuro.ok, false);

  // Residente atende a família: categoria fica gravada no atendimento.
  ctx.novaExecucao();
  ctx.apiSalvarProfissional({ nome: 'Iohana', email: 'iohana@exemplo.com', categoria: 'RESIDENTE', perfil: 'PROFISSIONAL' });
  ctx.novaExecucao();
  const residente = ctx.listar('PROFISSIONAIS').find((p) => p.email === 'iohana@exemplo.com');
  const a2 = ctx.apiRegistrarAtendimento({ caso_id: caso.id, data: '2026-10-20', publico: 'FAMÍLIA', profissional_id: residente.id });
  assert.equal(a2.ok, true, a2.erro);
  assert.equal(a2.dados.atendimentos[0].categoria, 'RESIDENTE');
  assert.equal(a2.dados.atendimentos[0].no_prazo, 'SIM');

  // Excluir o atendimento de 16/10 faz o de 20/10 ficar fora do prazo (limite 16/10 a partir da avaliação).
  ctx.novaExecucao();
  const excl = ctx.apiExcluirAtendimento(reg.id);
  assert.equal(excl.ok, true, excl.erro);
  assert.equal(excl.dados.atendimentos.length, 1);
  assert.equal(excl.dados.atendimentos[0].no_prazo, 'NÃO');

  ctx.novaExecucao();
  const fim = ctx.apiSalvarCaso({
    id: caso.id, paciente_id: paciente.id, unidade_id: unidade.id, data_solicitacao: '2026-10-13',
    data_avaliacao: '2026-10-14', necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id,
    data_encerramento: '2026-10-20', desfecho: 'ALTA'
  });
  assert.equal(fim.ok, true, fim.erro);
  assert.equal(fim.dados.caso.status, 'ENCERRADO');
  assert.equal(fim.dados.caso.proximo_prazo, '');
  assert.equal(Number(fim.dados.caso.dias_acompanhamento), 6);
});

test('mudar o prazo da justificativa recalcula os casos abertos', () => {
  const { ctx, j, paciente, unidade } = sistemaComCaso();
  const caso = ctx.apiSalvarCaso({
    paciente_id: paciente.id, unidade_id: unidade.id, data_solicitacao: '2026-10-13', data_avaliacao: '2026-10-14',
    necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id
  }).dados.caso;
  ctx.novaExecucao();
  ctx.apiSalvarJustificativa({ id: j.id, nome: j.nome, prazo_dias_uteis: '5', ordem: j.ordem });
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('CASOS', caso.id).proximo_prazo, '2026-10-21');
  ctx.novaExecucao();
  const lista = ctx.apiListarCasos({ status: 'ABERTO' });
  assert.equal(lista.dados[0].situacao, 'NO PRAZO');
});
