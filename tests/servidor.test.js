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
  assert.equal(ctx.listar('DESFECHOS').length, 6);
  assert.equal(ctx.listar('PARAMETROS')[0].valor, '3');
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

test('pacientes: listagem inicial vazia e cadastro encontrado ao voltar à tela', () => {
  const { ctx } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();

  const vazio = ctx.apiListarPacientes();
  assert.equal(vazio.ok, true, vazio.erro);
  assert.equal(vazio.dados.total, 0);
  assert.equal(vazio.dados.pagina, 1);
  assert.equal(vazio.dados.paginas, 1);
  assert.equal(vazio.dados.pacientes.length, 0);

  const salvo = ctx.apiSalvarPaciente({ prontuario: '7', nome: 'Paciente de teste' });
  assert.equal(salvo.ok, true, salvo.erro);
  ctx.novaExecucao();
  const lista = ctx.apiListarPacientes({ termo: '', pagina: 1 });
  assert.equal(lista.dados.total, 1);
  assert.equal(lista.dados.pacientes[0].id, salvo.dados.id);

  ctx.novaExecucao();
  const busca = ctx.apiListarPacientes({ termo: '7' });
  assert.equal(busca.dados.total, 1);
  assert.equal(busca.dados.pacientes[0].id, salvo.dados.id);
  assert.equal(ctx.apiBuscarPacientes('').dados.length, 0); // A busca usada nos seletores continua igual.
});

test('pacientes: páginas sem omissões, ordenação por nome e filtro além dos primeiros 20', () => {
  const { ctx } = carregarSistema();
  ctx.configurar();
  for (let i = 24; i >= 0; i--) {
    const r = ctx.apiSalvarPaciente({ prontuario: String(100 + i), nome: 'Paciente ' + String(i).padStart(2, '0') });
    assert.equal(r.ok, true, r.erro);
    ctx.novaExecucao();
  }
  const primeira = ctx.apiListarPacientes({ pagina: 1 }).dados;
  const segunda = ctx.apiListarPacientes({ pagina: 2 }).dados;
  assert.equal(primeira.total, 25);
  assert.equal(primeira.paginas, 2);
  assert.equal(primeira.tamanho_pagina, 20);
  assert.equal(primeira.pacientes.length, 20);
  assert.equal(segunda.pacientes.length, 5);
  const todos = [...primeira.pacientes, ...segunda.pacientes];
  assert.equal(new Set(todos.map(p => p.id)).size, 25);
  assert.equal(todos[0].nome, 'PACIENTE 00');
  assert.equal(todos[24].nome, 'PACIENTE 24');
  assert.equal(ctx.apiListarPacientes({ pagina: 99 }).dados.pagina, 2);
  for (const pagina of [-1, 0, 'inválida', Infinity]) {
    assert.equal(ctx.apiListarPacientes({ pagina }).dados.pagina, 1);
  }
  const nome = ctx.apiListarPacientes({ termo: 'paciénte', pagina: 2 }).dados;
  assert.equal(nome.total, 25);
  assert.equal(nome.pacientes.length, 5);
  const prontuario = ctx.apiListarPacientes({ termo: '124', pagina: 2 }).dados;
  assert.equal(prontuario.total, 1);
  assert.equal(prontuario.pagina, 1);
  assert.equal(prontuario.pacientes[0].prontuario, '124');
  assert.equal(ctx.apiListarPacientes({ termo: '12' }).dados.total, 0); // Prontuário exato.
});

test('pacientes: listagem não permite acesso por usuário sem cadastro', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  google.sessao.email = 'sem-acesso@exemplo.com';
  ctx.novaExecucao();
  const negado = ctx.apiListarPacientes();
  assert.equal(negado.ok, false);
  assert.match(negado.erro, /não tem acesso/);
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

function sistemaComAdmissao() {
  const sis = carregarSistema();
  const { ctx } = sis;
  ctx.configurar();
  ctx.novaExecucao();
  vm.runInContext("hoje = function () { return '2026-10-20'; }; agora = function () { return '2026-10-20 12:00'; }", ctx);
  const j = ctx.listar('JUSTIFICATIVAS').find((x) => x.nome === 'POUCOS RECURSOS DE ENFRENTAMENTO');
  // POUCOS RECURSOS é prioridade MODERADA; nos testes o prazo dela fica em 2 dias úteis.
  const moderada = ctx.listar('PRIORIDADES').find((p) => p.tipo === 'SEGUIMENTO' && p.nome === 'MODERADA');
  ctx.apiSalvarPrioridade({ ...moderada, prazo: '2' });
  ctx.novaExecucao();
  const paciente = ctx.apiSalvarPaciente({ prontuario: '161349', nome: 'Francisca Kelyane' }).dados;
  ctx.novaExecucao();
  const unidade = ctx.listar('UNIDADES').find((u) => u.nome === 'CM 2');
  const desfecho = (nome) => ctx.listar('DESFECHOS').find((d) => d.nome === nome);
  const admitir = (extra = {}) => {
    ctx.novaExecucao();
    const r = ctx.apiSalvarAdmissao({
      paciente_id: paciente.id, unidade_id: unidade.id, data_admissao: '2026-10-09',
      necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id, ...extra
    });
    ctx.novaExecucao();
    return r;
  };
  const atender = (adm, extra) => {
    ctx.novaExecucao();
    const r = ctx.apiRegistrarAtendimento({ admissao_id: adm.id, data: '2026-10-14', hora: '10:00', publico: 'PACIENTE', tipo_atendimento: extra && extra.interconsulta_id ? 'INTERCONSULTA' : 'BUSCA ATIVA', ...extra });
    ctx.novaExecucao();
    return r;
  };
  return { ...sis, j, moderada, paciente, unidade, desfecho, admitir, atender };
}

test('fluxo separado: entrada cria ID e aparece para atendimento sem exigir dados clínicos', () => {
  const { ctx, paciente, unidade } = sistemaComAdmissao();
  const motivo = ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.prioridade_id);
  const entrada = ctx.apiSalvarEntradaAdmissao({
    paciente_id: paciente.id, data_admissao: '2026-10-20', unidade_id: unidade.id,
    tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: motivo.id,
    data_solicitacao: '2026-10-20', hora_solicitacao: '08:00', observacoes: 'Entrada de teste',
    descricao_demanda: 'Não pertence à entrada', necessidade_acompanhamento: 'PACIENTE',
    desfecho_id: 'ignorado', data_desfecho: '2026-10-20'
  });
  assert.equal(entrada.ok, true, entrada.erro);
  const a = entrada.dados.admissao;
  assert.ok(a.id);
  assert.equal(a.status, 'AGUARDANDO 1º ATENDIMENTO');
  assert.equal(a.observacoes, 'Entrada de teste');
  assert.equal(a.descricao_demanda, '');
  assert.equal(a.necessidade_acompanhamento, '');
  assert.equal(a.desfecho_id, '');
  assert.ok(a.prazo_primeiro_atendimento);
  assert.equal(a.prazo_resposta, '');
  assert.equal(entrada.dados.interconsultas.length, 0);
  assert.equal(entrada.dados.atendimentos.length, 0);
  ctx.novaExecucao();
  const lista = ctx.apiGestao({ setor_id: unidade.setor_id, unidade_id: unidade.id });
  assert.equal(lista.ok, true, lista.erro);
  assert.equal(lista.dados.itens[0].id, a.id);
  assert.equal(lista.dados.resumo.aguardando_primeiro, 1);
});

test('fluxo separado: editar entrada preserva acompanhamento, registros e histórico de desfecho', () => {
  const { ctx, paciente, unidade, j, admitir, atender, desfecho } = sistemaComAdmissao();
  const a = admitir().dados.admissao;
  const clinico = ctx.apiSalvarAcompanhamento({
    id: a.id, descricao_demanda: 'ADESÃO AO TRATAMENTO',
    necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id,
    data_admissao: '2026-10-20', paciente_id: 'ignorado', unidade_id: 'ignorada'
  });
  assert.equal(clinico.ok, true, clinico.erro);
  assert.equal(clinico.dados.admissao.data_admissao, a.data_admissao);
  assert.equal(clinico.dados.admissao.paciente_id, paciente.id);
  const at = atender(a, { data: '2026-10-14' }).dados.atendimentos[0];
  ctx.novaExecucao();
  const fim = ctx.apiSalvarDesfechoAdmissao({ id: a.id, desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-15' });
  assert.equal(fim.ok, true, fim.erro);
  const historicoId = fim.dados.desfechos[0].id;
  ctx.novaExecucao();
  const alterada = ctx.apiSalvarEntradaAdmissao({ id: a.id, observacoes: 'Entrada corrigida' });
  assert.equal(alterada.ok, true, alterada.erro);
  assert.equal(alterada.dados.admissao.id, a.id);
  assert.equal(alterada.dados.admissao.unidade_id, unidade.id);
  assert.equal(alterada.dados.admissao.descricao_demanda, 'ADESÃO AO TRATAMENTO');
  assert.equal(alterada.dados.admissao.justificativa_id, j.id);
  assert.equal(alterada.dados.admissao.desfecho_id, desfecho('ALTA PSICOLÓGICA').id);
  assert.equal(alterada.dados.atendimentos[0].id, at.id);
  assert.equal(alterada.dados.desfechos.length, 1);
  assert.equal(alterada.dados.desfechos[0].id, historicoId);
});

test('fluxo separado: acompanhamento não altera entrada nem apaga campos omitidos', () => {
  const { ctx, paciente, unidade, j } = sistemaComAdmissao();
  const entrada = ctx.apiSalvarEntradaAdmissao({
    paciente_id: paciente.id, data_admissao: '2026-10-09', unidade_id: unidade.id,
    tipo_solicitacao: 'EQUIPE', data_solicitacao: '2026-10-10', hora_solicitacao: '09:00',
    para_quem: 'FAMILIAR', familiar_nome: 'Familiar fictício', familiar_parentesco: 'Irmã', observacoes: 'Entrada'
  });
  assert.equal(entrada.ok, true, entrada.erro);
  const a = entrada.dados.admissao;
  ctx.novaExecucao();
  let r = ctx.apiSalvarAcompanhamento({ id: a.id, necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id, descricao_demanda: 'COMUNICAÇÃO' });
  assert.equal(r.ok, true, r.erro);
  ctx.novaExecucao();
  r = ctx.apiSalvarAcompanhamento({ id: a.id, descricao_demanda: 'ADESÃO AO TRATAMENTO' });
  assert.equal(r.ok, true, r.erro);
  const b = r.dados.admissao;
  for (const campo of ['paciente_id', 'data_admissao', 'unidade_id', 'tipo_solicitacao', 'data_solicitacao', 'hora_solicitacao', 'para_quem', 'familiar_nome', 'familiar_parentesco', 'observacoes']) {
    assert.equal(b[campo], a[campo], campo);
  }
  assert.equal(b.necessidade_acompanhamento, 'PACIENTE');
  assert.equal(b.justificativa_id, j.id);
  const invalido = ctx.apiSalvarAcompanhamento({ id: a.id, justificativa_id: 'inexistente' });
  assert.equal(invalido.ok, false);
  assert.match(invalido.erro, /Justificativa não encontrada/);
});

test('fluxo separado: desfecho é independente, valida datas e pode ser corrigido sem apagar dados clínicos', () => {
  const { ctx, j, admitir, atender, desfecho } = sistemaComAdmissao();
  const a = admitir().dados.admissao;
  const at = atender(a, { data: '2026-10-14' }).dados.atendimentos[0];
  ctx.novaExecucao();
  const invalido = ctx.apiSalvarDesfechoAdmissao({ id: a.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-13' });
  assert.equal(invalido.ok, false);
  assert.match(invalido.erro, /antes do último atendimento/);
  ctx.novaExecucao();
  let r = ctx.apiSalvarDesfechoAdmissao({ id: a.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-15', justificativa_id: '' });
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.admissao.status, 'ENCERRADA');
  assert.equal(r.dados.admissao.justificativa_id, j.id);
  assert.equal(r.dados.atendimentos[0].id, at.id);
  assert.equal(r.dados.desfechos.length, 1);
  const hid = r.dados.desfechos[0].id;
  ctx.novaExecucao();
  r = ctx.apiSalvarDesfechoAdmissao({ id: a.id, data_desfecho: '2026-10-16' });
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.desfechos[0].id, hid);
  assert.equal(r.dados.desfechos[0].data, '2026-10-16');
  ctx.novaExecucao();
  r = ctx.apiSalvarDesfechoAdmissao({ id: a.id, desfecho_id: '', data_desfecho: '' });
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.desfechos.length, 0);
  assert.equal(r.dados.admissao.status, 'EM ACOMPANHAMENTO');
  assert.equal(r.dados.admissao.justificativa_id, j.id);
});

test('fluxo separado: retomada mantém ID e nova internação mantém os históricos independentes', () => {
  const { ctx, paciente, unidade, j, admitir, atender, desfecho } = sistemaComAdmissao();
  const primeira = admitir().dados.admissao;
  atender(primeira, { data: '2026-10-14' });
  ctx.novaExecucao();
  assert.equal(ctx.apiSalvarDesfechoAdmissao({ id: primeira.id, desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-15' }).ok, true);
  ctx.novaExecucao();
  assert.equal(ctx.apiGestao({}).dados.itens.length, 0);
  assert.equal(ctx.apiGestao({ incluir_encerrados: 'SIM' }).dados.itens[0].id, primeira.id);
  assert.equal(ctx.apiSalvarAcompanhamento({ id: primeira.id, descricao_demanda: 'COMUNICAÇÃO' }).ok, false);
  ctx.novaExecucao();
  const retomada = ctx.apiRetomarAcompanhamento({ id: primeira.id, data: '2026-10-16', necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id });
  assert.equal(retomada.ok, true, retomada.erro);
  assert.equal(retomada.dados.admissao.id, primeira.id);
  assert.equal(retomada.dados.admissao.status, 'EM ACOMPANHAMENTO');
  assert.equal(retomada.dados.desfechos.length, 1);
  ctx.novaExecucao();
  assert.equal(ctx.apiSalvarDesfechoAdmissao({ id: primeira.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-17' }).ok, true);
  ctx.novaExecucao();
  const segunda = ctx.apiSalvarEntradaAdmissao({ paciente_id: paciente.id, data_admissao: '2026-10-19', unidade_id: unidade.id });
  assert.equal(segunda.ok, true, segunda.erro);
  assert.notEqual(segunda.dados.admissao.id, primeira.id);
  assert.equal(segunda.dados.atendimentos.length, 0);
  assert.equal(segunda.dados.desfechos.length, 0);
  ctx.novaExecucao();
  const registro = ctx.apiRegistrarAtendimento({ admissao_id: segunda.dados.admissao.id, data: '2026-10-20', hora: '10:00', publico: 'PACIENTE', tipo_atendimento: 'BUSCA ATIVA' });
  assert.equal(registro.ok, true, registro.erro);
  assert.equal(registro.dados.atendimentos.length, 1);
  assert.equal(registro.dados.atendimentos[0].admissao_id, segunda.dados.admissao.id);
  ctx.novaExecucao();
  const historico = ctx.apiObterAdmissao(primeira.id).dados;
  assert.equal(historico.atendimentos.length, 1);
  assert.equal(historico.atendimentos[0].admissao_id, primeira.id);
  assert.equal(historico.desfechos.length, 2);
  assert.equal(historico.outras_admissoes[0].id, segunda.dados.admissao.id);
  assert.equal(ctx.listar('PACIENTES').length, 1);
  assert.equal(ctx.listar('ADMISSOES').length, 2);
  assert.equal(ctx.apiSalvarDesfechoAdmissao({ id: primeira.id, desfecho_id: '', data_desfecho: '' }).ok, false, 'Não reabre internação antiga enquanto outra está aberta');
});

test('fluxo separado: APIs validam acesso e ID sem criar registros indevidos', () => {
  const { ctx, google, paciente, unidade, admitir } = sistemaComAdmissao();
  const a = admitir().dados.admissao;
  for (const api of ['apiSalvarAcompanhamento', 'apiSalvarDesfechoAdmissao']) {
    assert.equal(ctx[api]({}).ok, false);
    assert.equal(ctx[api]({ id: 'inexistente' }).ok, false);
  }
  assert.equal(ctx.apiSalvarEntradaAdmissao({ id: 'inexistente', paciente_id: paciente.id, data_admissao: '2026-10-19', unidade_id: unidade.id }).ok, false);
  assert.equal(ctx.apiSalvarEntradaAdmissao({ id: a.id, paciente_id: 'outro' }).ok, false);
  assert.equal(ctx.listar('ADMISSOES').length, 1);
  google.sessao.email = 'sem-acesso@exemplo.com';
  ctx.novaExecucao();
  for (const api of ['apiSalvarEntradaAdmissao', 'apiSalvarAcompanhamento', 'apiSalvarDesfechoAdmissao']) {
    const r = ctx[api]({ id: a.id });
    assert.equal(r.ok, false);
    assert.match(r.erro, /não tem acesso/);
  }
});

test('fluxo separado: cadastro de tipos de desfecho continua independente do registro na admissão', () => {
  const { ctx, admitir } = sistemaComAdmissao();
  const a = admitir().dados.admissao;
  const cadastro = ctx.apiSalvarDesfecho({ nome: 'Desfecho fictício', encerra_admissao: 'NÃO', ativo: 'SIM' });
  assert.equal(cadastro.ok, true, cadastro.erro);
  const tipo = cadastro.dados.desfechos.find(d => d.nome === 'DESFECHO FICTÍCIO');
  assert.ok(tipo);
  ctx.novaExecucao();
  const registro = ctx.apiSalvarDesfechoAdmissao({ id: a.id, desfecho_id: tipo.id, data_desfecho: '2026-10-15' });
  assert.equal(registro.ok, true, registro.erro);
  assert.equal(registro.dados.admissao.status, 'ACOMPANHAMENTO ENCERRADO');
  assert.equal(registro.dados.desfechos[0].desfecho_id, tipo.id);
});

test('admissão: abre aguardando o 1º atendimento e impede outra admissão aberta do paciente', () => {
  const { admitir } = sistemaComAdmissao();
  const r1 = admitir();
  assert.equal(r1.ok, true, r1.erro);
  const adm = r1.dados.admissao;
  assert.equal(adm.status, 'AGUARDANDO 1º ATENDIMENTO');
  assert.equal(adm.prazo_primeiro_atendimento, '2026-10-15'); // 3 dias úteis após sex 09/10, pulando o feriado de 12/10
  assert.equal(adm.primeiro_no_prazo, 'NÃO'); // hoje = 20/10 e ninguém atendeu
  assert.equal(adm.situacao, 'ATRASADO');

  const r2 = admitir({ data_admissao: '2026-10-15' });
  assert.equal(r2.ok, false);
  assert.match(r2.erro, /já tem uma admissão aberta/);
});

test('atendimentos: 1º no prazo, família com e sem impossibilidade, quantidade de familiares', () => {
  const { ctx, admitir, atender } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;

  const fam = atender(adm, { data: '2026-10-13', publico: 'FAMÍLIA', quantidade: '3', paciente_impossibilitado: 'NÃO' });
  assert.equal(fam.ok, true, fam.erro);
  assert.equal(Number(fam.dados.atendimentos[0].quantidade), 3);
  assert.equal(fam.dados.atendimentos[0].conta_prazo, 'NÃO');
  assert.equal(fam.dados.admissao.status, 'AGUARDANDO 1º ATENDIMENTO');

  const pac = atender(adm, { data: '2026-10-14' });
  assert.equal(pac.ok, true, pac.erro);
  assert.equal(pac.dados.admissao.status, 'EM ACOMPANHAMENTO');
  assert.equal(pac.dados.admissao.primeiro_no_prazo, 'SIM');
  assert.equal(pac.dados.admissao.proximo_prazo, '2026-10-16');
  assert.equal(pac.dados.atendimentos[0].categoria, 'PROFISSIONAL DA EMPRESA');

  // Paciente impossibilitado: o atendimento à família renova o prazo.
  const fam2 = atender(adm, { data: '2026-10-16', publico: 'FAMÍLIA', quantidade: '2', paciente_impossibilitado: 'SIM' });
  assert.equal(fam2.dados.atendimentos[0].conta_prazo, 'SIM');
  assert.equal(fam2.dados.atendimentos[0].no_prazo, 'SIM');
  assert.equal(fam2.dados.admissao.proximo_prazo, '2026-10-20');
  assert.equal(fam2.dados.admissao.situacao, 'VENCE HOJE');

  const futuro = atender(adm, { data: '2026-10-21' });
  assert.equal(futuro.ok, false);
  const antes = atender(adm, { data: '2026-10-08' });
  assert.equal(antes.ok, false);

  // Excluir o atendimento ao paciente faz o 1º atendimento passar a ser o da família de 16/10 (prazo era 15/10).
  const excl = ctx.apiExcluirAtendimento(pac.dados.atendimentos[0].id);
  assert.equal(excl.ok, true, excl.erro);
  assert.equal(excl.dados.admissao.primeiro_atendimento, '2026-10-16');
  assert.equal(excl.dados.admissao.primeiro_no_prazo, 'NÃO');
});

test('residente: categoria gravada no atendimento', () => {
  const { ctx, admitir, atender } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  ctx.apiSalvarProfissional({ nome: 'Iohana', email: 'iohana@exemplo.com', categoria: 'RESIDENTE', perfil: 'PROFISSIONAL' });
  ctx.novaExecucao();
  const residente = ctx.listar('PROFISSIONAIS').find((p) => p.email === 'iohana@exemplo.com');
  const r = atender(adm, { profissional_id: residente.id });
  assert.equal(r.dados.atendimentos[0].categoria, 'RESIDENTE');
  assert.equal(r.dados.atendimentos[0].profissional_nome, 'IOHANA');
});

test('desfecho psicológico mantém a admissão; retomada recomeça; saída do hospital encerra e libera nova admissão', () => {
  const { ctx, desfecho, admitir, atender, paciente, unidade, j } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  atender(adm, { data: '2026-10-13' });
  const base = { id: adm.id, paciente_id: paciente.id, unidade_id: unidade.id, data_admissao: '2026-10-09',
    necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id };

  const alta = ctx.apiSalvarAdmissao({ ...base, desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-15' });
  assert.equal(alta.ok, true, alta.erro);
  assert.equal(alta.dados.admissao.status, 'ACOMPANHAMENTO ENCERRADO');
  assert.equal(alta.dados.admissao.aberta, true);
  ctx.novaExecucao();
  assert.equal(atender(adm, { data: '2026-10-19' }).ok, false); // precisa retomar antes

  ctx.novaExecucao();
  assert.equal(admitir({ data_admissao: '2026-10-16' }).ok, false); // ainda internado: mesma admissão

  ctx.novaExecucao();
  const ret = ctx.apiRetomarAcompanhamento({ id: adm.id, data: '2026-10-19' });
  assert.equal(ret.ok, true, ret.erro);
  assert.equal(ret.dados.admissao.status, 'EM ACOMPANHAMENTO');
  assert.equal(ret.dados.admissao.proximo_prazo, '2026-10-21');
  assert.match(ret.dados.admissao.observacoes, /retomado em 19\/10\/2026/);

  const r2 = atender(adm, { data: '2026-10-20' });
  assert.equal(r2.dados.atendimentos[0].no_prazo, 'SIM');

  ctx.novaExecucao();
  const saiu = ctx.apiSalvarAdmissao({ ...base, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-20' });
  assert.equal(saiu.ok, true, saiu.erro);
  assert.equal(saiu.dados.admissao.status, 'ENCERRADA');
  assert.equal(saiu.dados.admissao.proximo_prazo, '');

  const nova = admitir({ data_admissao: '2026-10-20' });
  assert.equal(nova.ok, true, nova.erro);
  assert.equal(nova.dados.admissao.prazo_primeiro_atendimento, '2026-10-23');
  assert.equal(nova.dados.outras_admissoes.length, 1);
});

test('parâmetro do prazo do 1º atendimento e prazo da prioridade de seguimento recalculam as admissões abertas', () => {
  const { ctx, admitir, atender, moderada } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  const p = ctx.listar('PARAMETROS')[0];
  const r = ctx.apiSalvarParametro({ id: p.id, valor: '5' });
  assert.equal(r.ok, true, r.erro);
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('ADMISSOES', adm.id).prazo_primeiro_atendimento, '2026-10-19'); // 5 úteis, sem 12/10
  assert.equal(ctx.apiSalvarParametro({ id: p.id, valor: 'três' }).ok, false);

  atender(adm, { data: '2026-10-14' });
  ctx.apiSalvarPrioridade({ ...moderada, prazo: '5' });
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('ADMISSOES', adm.id).proximo_prazo, '2026-10-21');
  ctx.novaExecucao();
  const lista = ctx.apiListarAdmissoes({ abertas: 'SIM' });
  assert.equal(lista.dados[0].situacao, 'NO PRAZO');
});

test('compilado pela API e exportação para uma planilha nova', () => {
  const { ctx, google, admitir, atender } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  atender(adm, { data: '2026-10-14' });
  atender(adm, { data: '2026-10-16', publico: 'FAMÍLIA', quantidade: '2', paciente_impossibilitado: 'NÃO' });

  const c = ctx.apiCompilado({ ano: '2026', mes: '10', eixo: 'UNIDADE', grupo: 'TODOS' });
  assert.equal(c.ok, true, c.erro);
  const cm2 = c.dados.colunas.findIndex((x) => x.nome === 'CM 2');
  const linha = (t, rot) => c.dados.secoes.find((s) => s.titulo.startsWith(t)).linhas.find((l) => l.rotulo.startsWith(rot));
  assert.equal(linha('Atendimentos', 'PACIENTE').valores[cm2], 1);
  assert.equal(linha('Atendimentos', 'FAMÍLIA').valores[cm2], 2);
  assert.equal(linha('1º atendimento', 'NO PRAZO').valores[cm2], 1);
  assert.match(c.dados.secoes.find((s) => s.titulo.startsWith('1º atendimento')).titulo, /até 3 dia/);

  assert.equal(ctx.apiCompilado({ ano: '2026', eixo: 'UNIDADE' }).ok, false); // falta o mês

  ctx.novaExecucao();
  const exp = ctx.apiExportarCompilado({ ano: '2026', mes: '10', eixo: 'UNIDADE', grupo: 'EMPRESA' });
  assert.equal(exp.ok, true, exp.erro);
  const criada = google.criadas[0];
  assert.match(criada.getName(), /COMPILADO OUTUBRO DE 2026 — Profissionais da empresa/);
  const aba = criada.getSheets()[0];
  assert.equal(aba.getName(), 'Compilado');
  assert.equal(aba.linhas[0][0], 'COMPILADO OUTUBRO DE 2026');
  assert.ok(google.planilha.getSheetByName('ADMISSOES')); // o banco não foi mexido
});

test('registro do dia: reuniões e atividades gerenciais, com exclusão só pelo autor ou coordenação', () => {
  const { ctx, google, unidade } = sistemaComAdmissao();
  const reu = ctx.apiRegistrarReuniao({ data: '2026-10-19', unidade_id: unidade.id, tipo: 'GRUPO', quantidade: '2' });
  assert.equal(reu.ok, true, reu.erro);
  assert.equal(reu.dados.reunioes.length, 1);
  assert.equal(reu.dados.reunioes[0].unidade_nome, 'CM 2');
  ctx.novaExecucao();
  assert.equal(ctx.apiRegistrarReuniao({ data: '2026-10-19', tipo: 'GRUPO' }).ok, false); // sem unidade
  ctx.novaExecucao();
  const ger = ctx.apiRegistrarGerencial({ data: '2026-10-19', tipo: 'TREINAMENTO', quantidade: '1' });
  assert.equal(ger.ok, true, ger.erro);
  assert.equal(ger.dados.gerenciais.length, 1);
  ctx.novaExecucao();
  assert.equal(ctx.apiRegistrarGerencial({ data: '2026-10-19', tipo: 'INVENTADO' }).ok, false);

  ctx.novaExecucao();
  ctx.apiSalvarProfissional({ nome: 'Elane', email: 'elane@exemplo.com', categoria: 'PROFISSIONAL DA EMPRESA', perfil: 'PROFISSIONAL' });
  google.sessao.email = 'elane@exemplo.com';
  ctx.novaExecucao();
  const negado = ctx.apiExcluirGerencial(ger.dados.gerenciais[0].id);
  assert.equal(negado.ok, false);
  google.sessao.email = 'coordenacao@exemplo.com';
  ctx.novaExecucao();
  assert.equal(ctx.apiExcluirGerencial(ger.dados.gerenciais[0].id).dados.gerenciais.length, 0);

  ctx.novaExecucao();
  const c = ctx.apiCompilado({ ano: '2026', mes: '10', eixo: 'UNIDADE' }).dados;
  const grupo = c.secoes.find((s) => s.titulo === 'Reuniões de equipe').linhas.find((l) => l.rotulo === 'GRUPO');
  assert.equal(grupo.total, 2);
});

test('histórico de desfechos: retomada preserva o desfecho anterior; correção não duplica; apagar remove', () => {
  const { ctx, desfecho, admitir, atender, paciente, unidade, j } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  atender(adm, { data: '2026-10-13' });
  const base = { id: adm.id, paciente_id: paciente.id, unidade_id: unidade.id, data_admissao: '2026-10-09',
    necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id };
  const salvar = (extra) => { ctx.novaExecucao(); const r = ctx.apiSalvarAdmissao({ ...base, ...extra }); ctx.novaExecucao(); return r; };

  // Lança recusa por engano e corrige para alta psicológica: continua 1 registro.
  salvar({ desfecho_id: desfecho('RECUSA').id, data_desfecho: '2026-10-14' });
  const corrigido = salvar({ desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-15' });
  assert.equal(corrigido.dados.desfechos.length, 1);
  assert.equal(corrigido.dados.desfechos[0].desfecho_nome, 'ALTA PSICOLÓGICA');

  // Apagar o desfecho (lançado por engano) remove o registro; lançar de novo cria um só.
  assert.equal(salvar({}).dados.desfechos.length, 0);
  salvar({ desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-15' });

  // Retomada: o registro fica no histórico e não é mais o vigente.
  const ret = ctx.apiRetomarAcompanhamento({ id: adm.id, data: '2026-10-16' });
  assert.equal(ret.ok, true, ret.erro);
  assert.equal(ret.dados.desfechos.length, 1);
  assert.equal(ret.dados.desfechos[0].vigente, 'NÃO');

  atender(adm, { data: '2026-10-19' });
  const antesDaRetomada = salvar({ desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-15' });
  assert.equal(antesDaRetomada.ok, false);
  const alta = salvar({ desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-20' });
  assert.equal(alta.ok, true, alta.erro);
  assert.equal(alta.dados.desfechos.length, 2);
  assert.deepEqual(Array.from(alta.dados.desfechos, (d) => d.desfecho_nome), ['ALTA PSICOLÓGICA', 'ALTA']);

  const c = ctx.apiCompilado({ ano: '2026', mes: '10', eixo: 'UNIDADE' }).dados;
  const linhas = c.secoes.find((s) => s.titulo === 'Desfechos').linhas;
  assert.equal(linhas.find((l) => l.rotulo === 'TOTAL').total, 2);
  assert.equal(linhas.find((l) => l.rotulo === 'ALTA PSICOLÓGICA').total, 1);
  assert.equal(linhas.find((l) => l.rotulo.startsWith('… saídas')).total, 1);
});

test('solicitação: prazo em horas pela prioridade do motivo, familiar, motivo sem prioridade e compilado', () => {
  const { ctx, admitir, atender } = sistemaComAdmissao();
  const motivo = (nome) => ctx.listar('MOTIVOS_SOLICITACAO').find((m) => m.nome === nome);
  const sol = { tipo_solicitacao: 'EQUIPE', data_solicitacao: '2026-10-19', hora_solicitacao: '8:00' };

  const semNome = admitir({ ...sol, motivo_solicitacao_id: motivo('RISCO DE SUICÍDIO').id, para_quem: 'FAMILIAR' });
  assert.equal(semNome.ok, false);
  assert.match(semNome.erro, /familiar/);

  const r = admitir({ ...sol, motivo_solicitacao_id: motivo('RISCO DE SUICÍDIO').id, para_quem: 'FAMILIAR', familiar_nome: 'maria', familiar_parentesco: 'mãe' });
  assert.equal(r.ok, true, r.erro);
  const adm = r.dados.admissao;
  assert.equal(adm.hora_solicitacao, '08:00');
  assert.equal(adm.familiar_parentesco, 'MÃE');
  assert.equal(adm.prioridade_solicitacao, 'ALTA');
  assert.equal(adm.prazo_resposta, '2026-10-20 08:00');
  assert.equal(adm.resposta_no_prazo, 'NÃO'); // agora = 20/10 12:00, ninguém respondeu
  assert.equal(adm.aguardando_resposta, true);
  assert.equal(adm.situacao, 'ATRASADO');
  assert.equal(adm.motivo_nome, 'RISCO DE SUICÍDIO');
  assert.equal(adm.prioridade_demanda, 'MODERADA'); // da justificativa POUCOS RECURSOS

  const semHora = atender(adm, { hora: '' });
  assert.equal(semHora.ok, false);
  const futuro = atender(adm, { data: '2026-10-20', hora: '13:00' });
  assert.equal(futuro.ok, false);

  // Solicitação para familiar: atendimento à família responde, mesmo sem o paciente impossibilitado.
  const resp = atender(adm, { data: '2026-10-19', hora: '10:30', publico: 'FAMÍLIA', quantidade: '1', paciente_impossibilitado: 'NÃO' });
  assert.equal(resp.ok, true, resp.erro);
  assert.equal(resp.dados.admissao.momento_resposta, '2026-10-19 10:30');
  assert.equal(Number(resp.dados.admissao.horas_resposta), 2.5);
  assert.equal(resp.dados.admissao.resposta_no_prazo, 'SIM');
  assert.equal(resp.dados.atendimentos[0].hora, '10:30');

  const c = ctx.apiCompilado({ ano: '2026', mes: '10', eixo: 'UNIDADE' }).dados;
  const sec = c.secoes.find((s) => s.titulo.startsWith('Resposta à solicitação'));
  assert.equal(sec.linhas.find((l) => l.rotulo === 'NO PRAZO').total, 1);
  assert.equal(sec.linhas.find((l) => l.rotulo === '% NO PRAZO — ALTA').total, 1);
  assert.equal(sec.linhas.find((l) => l.rotulo.startsWith('MÉDIA DE HORAS')).total, 2.5);
  const motivoSec = c.secoes.find((s) => s.titulo === 'Motivo da solicitação');
  assert.equal(motivoSec.linhas.find((l) => l.rotulo === 'RISCO DE SUICÍDIO').total, 1);
});

test('motivo sem prioridade fica sem prazo até a coordenação definir; tipos com prazo são configuráveis', () => {
  const { ctx, admitir, paciente } = sistemaComAdmissao();
  const triagem = ctx.listar('MOTIVOS_SOLICITACAO').find((m) => m.nome === 'TRIAGEM PSICOLÓGICA');
  const adm = admitir({ tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: triagem.id, data_solicitacao: '2026-10-19', hora_solicitacao: '09:00' }).dados.admissao;
  assert.equal(adm.resposta_no_prazo, 'SEM PRAZO');
  assert.equal(adm.situacao, 'ATRASADO'); // vem do 1º atendimento (3 dias úteis da admissão), não da solicitação

  const baixa = ctx.listar('PRIORIDADES').find((p) => p.tipo === 'SOLICITAÇÃO' && p.nome === 'BAIXA');
  const r = ctx.apiSalvarMotivo({ ...triagem, prioridade_id: baixa.id });
  assert.equal(r.ok, true, r.erro);
  ctx.novaExecucao();
  const depois = ctx.buscarPorId('ADMISSOES', adm.id);
  assert.equal(depois.prioridade_solicitacao, 'BAIXA');
  assert.equal(depois.prazo_resposta, '2026-10-22 09:00');
  assert.equal(depois.resposta_no_prazo, 'EM ANDAMENTO');

  const seg = ctx.listar('PRIORIDADES').find((p) => p.tipo === 'SEGUIMENTO');
  assert.equal(ctx.apiSalvarMotivo({ ...triagem, prioridade_id: seg.id }).ok, false); // prioridade do tipo errado

  ctx.novaExecucao();
  const p = ctx.listar('PARAMETROS').find((x) => x.chave === 'TIPOS_SOLICITACAO_COM_PRAZO');
  assert.equal(ctx.apiSalvarParametro({ id: p.id, valor: 'EQUIPE, INVENTADO' }).ok, false);
  ctx.novaExecucao();
  assert.equal(ctx.apiSalvarParametro({ id: p.id, valor: 'ESPONTÂNEA' }).ok, true);
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('ADMISSOES', adm.id).resposta_no_prazo, 'SEM PRAZO'); // EQUIPE saiu da lista
  void paciente;
});

test('autoteste (testarSistema) passa e não mexe no banco real', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();
  const abasAntes = google.planilha.getSheets().map((a) => a.linhas.length).join(',');
  ctx.HtmlService = { createTemplateFromFile: () => ({ evaluate: () => ({ getContent: () => 'Gestão da Psicologia telaAdmissoes' }) }) };
  vm.runInContext('HtmlService = this.HtmlService', ctx);
  const saida = ctx.testarSistema();
  assert.match(saida, /RESULTADO: TUDO OK/, saida);
  assert.equal(google.planilha.getSheets().map((a) => a.linhas.length).join(','), abasAntes);
  assert.equal(google.criadas.length, 2); // planilha de teste + exportação de teste
});

test('gestão: pacientes ativos por unidade, interconsultas pendentes e respondidas', () => {
  const { ctx, admitir, atender, unidade } = sistemaComAdmissao();
  const motivo = (nome) => ctx.listar('MOTIVOS_SOLICITACAO').find((m) => m.nome === nome);
  const adm = admitir({ data_admissao: '2026-10-19', tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: motivo('RISCO DE SUICÍDIO').id,
    data_solicitacao: '2026-10-20', hora_solicitacao: '08:00' }).dados.admissao;

  // Segundo paciente, sem solicitação, já em acompanhamento.
  ctx.novaExecucao();
  const p2 = ctx.apiSalvarPaciente({ prontuario: '222', nome: 'Segundo Paciente' }).dados;
  ctx.novaExecucao();
  const outra = ctx.listar('UNIDADES').find((u) => u.nome === 'UTI 1');
  const j = ctx.listar('JUSTIFICATIVAS').find((x) => x.nome === 'RISCO DE SUICÍDIO');
  const adm2 = ctx.apiSalvarAdmissao({ paciente_id: p2.id, unidade_id: outra.id, data_admissao: '2026-10-15',
    necessidade_acompanhamento: 'PACIENTE', justificativa_id: j.id }).dados.admissao;
  atender(adm2, { data: '2026-10-16', hora: '09:00' });

  ctx.novaExecucao();
  const g = ctx.apiGestao({});
  assert.equal(g.ok, true, g.erro);
  assert.equal(g.dados.itens.length, 2);
  assert.equal(g.dados.resumo.aguardando_primeiro, 1);
  assert.equal(g.dados.resumo.interconsultas_pendentes, 1);
  // 2º paciente: risco de suicídio = prioridade ALTA, retorno em até 2 dias úteis após sex 16/10 → ter 20/10 (hoje).
  assert.equal(g.dados.resumo.atrasados, 0);
  assert.equal(g.dados.resumo.vencem_hoje, 1);
  const primeiro = g.dados.itens[0];
  assert.equal(primeiro.paciente_nome, 'SEGUNDO PACIENTE'); // o mais urgente vem primeiro
  assert.deepEqual({ ...primeiro.prazos.proximo }, { tipo: 'RETORNO', prazo: '2026-10-20', situacao: 'VENCE HOJE' });
  assert.equal(primeiro.periodicidade, '3x por semana ou mais');
  // 1º paciente: interconsulta alta (24h) solicitada 20/10 08:00 → vence 21/10 08:00; agora 20/10 12:00 → faltam 20h.
  const doCm2 = g.dados.itens.find((i) => i.unidade_id === unidade.id);
  assert.equal(doCm2.dias_internado, 1);
  assert.equal(doCm2.prazos.interconsulta.horas_restantes, 20);
  assert.equal(doCm2.prazos.proximo.tipo, 'INTERCONSULTA');
  ctx.novaExecucao();
  assert.equal(ctx.apiGestao({ unidade_id: outra.id }).dados.itens.length, 1);
  ctx.novaExecucao();
  assert.equal(ctx.apiGestao({ termo: '222' }).dados.itens[0].paciente_nome, 'SEGUNDO PACIENTE');

  ctx.novaExecucao();
  const pend = ctx.apiInterconsultas({ situacao: 'PENDENTES' });
  assert.equal(pend.ok, true, pend.erro);
  assert.equal(pend.dados.itens.length, 1);
  atender(adm, { data: '2026-10-20', hora: '11:00' });
  ctx.novaExecucao();
  const resp = ctx.apiInterconsultas({ situacao: 'RESPONDIDAS' });
  assert.equal(resp.dados.itens.length, 1);
  assert.equal(resp.dados.resumo.no_prazo, 1);
  assert.equal(Number(resp.dados.itens[0].prazos.interconsulta.horas), 3);
});

function solicitar(sis, adm, extra = {}) {
  sis.ctx.novaExecucao();
  const motivo = sis.ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.nome === 'RISCO DE SUICÍDIO');
  const r = sis.ctx.apiRegistrarInterconsulta({ admissao_id: adm.id, tipo_solicitacao: 'EQUIPE',
    motivo_solicitacao_id: motivo.id, data_solicitacao: '2026-10-19', hora_solicitacao: '08:00', para_quem: 'PACIENTE', ...extra });
  sis.ctx.novaExecucao();
  return r;
}

test('histórico separa duas interconsultas no prazo do primeiro atendimento anterior ao início do indicador', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  vm.runInContext("hoje = function () { return '2026-10-22'; }; agora = function () { return '2026-10-22 19:00'; }", ctx);
  const adm = admitir({ data_admissao: '2026-10-16' }).dados.admissao;
  const i1 = solicitar(sis, adm, { data_solicitacao: '2026-10-22', hora_solicitacao: '17:50' }).dados.interconsultas[0];
  const i2 = solicitar(sis, adm, { data_solicitacao: '2026-10-22', hora_solicitacao: '18:05' }).dados.interconsultas[1];
  const primeiro = atender(adm, { data: '2026-10-22', hora: '18:10', interconsulta_id: i1.id });
  assert.equal(primeiro.ok, true, primeiro.erro);
  const segundo = atender(adm, { data: '2026-10-22', hora: '18:17', interconsulta_id: i2.id });
  assert.equal(segundo.ok, true, segundo.erro);
  for (const at of segundo.dados.atendimentos) {
    assert.equal(at.no_prazo, 'NÃO'); // campo original preservado
    assert.equal(at.prazo_limite, '2026-10-21');
    assert.equal(at.prazo_acompanhamento.resultado, 'FORA DO ESCOPO');
    assert.equal(at.prazo_acompanhamento.prazo, '');
    assert.equal(at.interconsultas_respondidas.length, 1);
    assert.equal(at.interconsultas_respondidas[0].resposta_no_prazo, 'SIM');
  }
  assert.equal(segundo.dados.atendimentos[0].interconsultas_respondidas[0].id, i2.id);
  assert.equal(segundo.dados.atendimentos[1].interconsultas_respondidas[0].id, i1.id);
  assert.equal(segundo.dados.admissao.primeiro_em_avaliacao, false);
  ctx.apiExcluirInterconsulta(i2.id);
  assert.equal(ctx.apiObterAdmissao(adm.id).dados.atendimentos[0].interconsultas_respondidas.length, 0);
});

test('histórico mantém atraso clínico válido separado da interconsulta respondida no prazo', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  vm.runInContext("hoje = function () { return '2026-11-10'; }; agora = function () { return '2026-11-10 12:00'; }", ctx);
  const adm = admitir({ data_admissao: '2026-11-03' }).dados.admissao;
  const i = solicitar(sis, adm, { data_solicitacao: '2026-11-10', hora_solicitacao: '09:00' }).dados.interconsultas[0];
  const r = atender(adm, { data: '2026-11-10', hora: '10:00', interconsulta_id: i.id });
  assert.equal(r.ok, true, r.erro);
  const at = r.dados.atendimentos[0];
  assert.equal(r.dados.admissao.primeiro_em_avaliacao, true);
  assert.equal(at.prazo_acompanhamento.tipo, 'PRIMEIRO');
  assert.equal(at.prazo_acompanhamento.resultado, 'NÃO');
  assert.equal(at.prazo_acompanhamento.prazo, '2026-11-06');
  assert.equal(at.interconsultas_respondidas[0].resposta_no_prazo, 'SIM');
});

test('seguimento psicológico é aceito como tipo da solicitação e retornos de outubro continuam avaliados', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  assert.ok(ctx.apiInicio().dados.tipos_atendimento.includes('SEGUIMENTO PSICOLÓGICO'));
  const adm = admitir().dados.admissao;
  atender(adm);
  const r = atender(adm, { data: '2026-10-19', tipo_atendimento: 'SEGUIMENTO PSICOLÓGICO' });
  assert.equal(r.ok, true, r.erro);
  const at = r.dados.atendimentos[0];
  assert.equal(at.tipo_atendimento, 'SEGUIMENTO PSICOLÓGICO');
  assert.equal(at.prazo_acompanhamento.tipo, 'RETORNO');
  assert.equal(at.prazo_acompanhamento.resultado, 'NÃO');
  assert.equal(at.interconsultas_respondidas.length, 0);
});

test('histórico respeita vínculos de solicitações antigas e várias respostas vinculadas ao mesmo atendimento', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  const motivo = ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.nome === 'RISCO DE SUICÍDIO');
  const adm = admitir({ tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: motivo.id,
    data_solicitacao: '2026-10-19', hora_solicitacao: '08:00' }).dados.admissao;
  const i1 = solicitar(sis, adm).dados.interconsultas.find(i => i.origem !== 'LEGADO');
  const i2 = solicitar(sis, adm).dados.interconsultas.find(i => i.id !== i1.id && i.origem !== 'LEGADO');
  const contato = atender(adm, { data: '2026-10-19', hora: '09:00' });
  assert.equal(contato.ok, true, contato.erro);
  const at = contato.dados.atendimentos[0];
  assert.equal(at.interconsultas_respondidas.length, 1);
  assert.equal(at.interconsultas_respondidas[0].id, 'legado_' + adm.id);
  ctx.apiResponderInterconsulta({ id: i1.id, atendimento_id: at.id });
  const r = ctx.apiResponderInterconsulta({ id: i2.id, atendimento_id: at.id });
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.atendimentos[0].interconsultas_respondidas.length, 3);
});

test('justificativa no atendimento: salva dados clínicos pendentes, primeiro atendimento define retorno e preserva histórico ao mudar', () => {
  const sis = sistemaComAdmissao();
  const { ctx, paciente, unidade, atender } = sis;
  const alta = ctx.listar('JUSTIFICATIVAS').find(j => j.nome === 'RISCO DE SUICÍDIO');
  const baixa = ctx.listar('JUSTIFICATIVAS').find(j => j.nome === 'BONS A PARCIAIS RECURSOS DE ENFRENTAMENTO');
  const entrada = ctx.apiSalvarEntradaAdmissao({ paciente_id: paciente.id, unidade_id: unidade.id, data_admissao: '2026-10-09' });
  assert.equal(entrada.ok, true, entrada.erro);
  const adm = entrada.dados.admissao;
  const clinico = ctx.apiSalvarAcompanhamento({ id: adm.id, necessidade_acompanhamento: 'PACIENTE', descricao_demanda: 'COMUNICAÇÃO' });
  assert.equal(clinico.ok, true, clinico.erro);
  assert.equal(clinico.dados.admissao.justificativa_id, '');
  assert.equal(ctx.apiSalvarEntradaAdmissao({ id: adm.id, observacoes: 'Entrada revisada' }).ok, true);
  const primeiro = atender(adm, { justificativa_id: alta.id });
  assert.equal(primeiro.ok, true, primeiro.erro);
  const idPrimeiro = primeiro.dados.atendimentos[0].id;
  assert.equal(primeiro.dados.atendimentos[0].justificativa_id, alta.id);
  assert.equal(primeiro.dados.atendimentos[0].justificativa_nome, alta.nome);
  assert.equal(primeiro.dados.admissao.justificativa_id, alta.id);
  assert.equal(primeiro.dados.admissao.proximo_prazo, '2026-10-16');
  const retorno = atender(adm, { data: '2026-10-19', justificativa_id: baixa.id });
  assert.equal(retorno.ok, true, retorno.erro);
  assert.equal(retorno.dados.admissao.justificativa_id, baixa.id);
  assert.equal(retorno.dados.admissao.proximo_prazo, '2026-10-26');
  assert.equal(retorno.dados.atendimentos.find(a => a.id === idPrimeiro).justificativa_id, alta.id);
  assert.equal(retorno.dados.atendimentos[0].no_prazo, 'NÃO'); // avaliado pelo prazo da justificativa anterior
  const painel = ctx.apiIndicadores({ ano: 2026, mes: 10 });
  assert.equal(painel.ok, true, painel.erro);
  assert.equal(painel.dados.acompanhamento.grupos.find(g => g.nome === alta.nome).resumo.fora_prazo, 1);
});

test('justificativa do atendimento: inválida ou ausente quando necessária não grava nem altera dados', () => {
  const { ctx, admitir, atender } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  const antes = JSON.stringify(ctx.buscarPorId('ADMISSOES', adm.id));
  for (const justificativa_id of ['inexistente', '']) {
    const r = atender(adm, { justificativa_id });
    assert.equal(r.ok, false);
    assert.match(r.erro, /justificativa/);
    assert.equal(ctx.listar('ATENDIMENTOS').length, 0);
    assert.equal(JSON.stringify(ctx.buscarPorId('ADMISSOES', adm.id)), antes);
  }
});

test('justificativa retroativa ou de familiar sem impossibilidade não substitui a justificativa do último contato válido', () => {
  const { ctx, admitir, atender, j } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  const alta = ctx.listar('JUSTIFICATIVAS').find(x => x.nome === 'RISCO DE SUICÍDIO');
  assert.equal(atender(adm, { data: '2026-10-19', justificativa_id: j.id }).ok, true);
  const retroativo = atender(adm, { data: '2026-10-14', justificativa_id: alta.id });
  assert.equal(retroativo.ok, true, retroativo.erro);
  assert.equal(retroativo.dados.admissao.justificativa_id, j.id);
  assert.equal(retroativo.dados.atendimentos.find(a => a.data === '2026-10-14').justificativa_id, alta.id);
  const familia = atender(adm, { data: '2026-10-20', publico: 'FAMÍLIA', paciente_impossibilitado: 'NÃO', justificativa_id: alta.id });
  assert.equal(familia.ok, true, familia.erro);
  assert.equal(familia.dados.admissao.justificativa_id, j.id);
  assert.equal(familia.dados.atendimentos[0].justificativa_id, alta.id);
});

test('horas úteis em interconsulta: feriado, gestão, resposta e compilado compartilham o prazo sem inflar prioridade', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  vm.runInContext("hoje = function () { return '2026-10-30'; }; agora = function () { return '2026-10-30 12:00'; }", ctx);
  const adm = admitir().dados.admissao;
  const pedido = solicitar(sis, adm, { data_solicitacao: '2026-10-30', hora_solicitacao: '10:00' });
  assert.equal(pedido.ok, true, pedido.erro);
  const i = pedido.dados.interconsultas[0];
  assert.equal(i.prazo_resposta, '2026-11-03 10:00'); // 02/11 é feriado cadastrado
  assert.equal(i.prazo.horas_restantes, 22);
  assert.equal(ctx.apiGestao({}).dados.itens[0].prazos.interconsulta.horas_restantes, 22);
  vm.runInContext("hoje = function () { return '2026-11-02'; }; agora = function () { return '2026-11-02 12:00'; }", ctx);
  ctx.novaExecucao();
  const feriado = ctx.apiInterconsultas({ situacao: 'PENDENTES' }).dados;
  assert.equal(feriado.resumo.atrasadas, 0);
  assert.equal(feriado.itens[0].prazos.interconsulta.horas_restantes, 10);
  vm.runInContext("hoje = function () { return '2026-11-03'; }; agora = function () { return '2026-11-03 12:00'; }", ctx);
  const contato = atender(adm, { data: '2026-11-03', hora: '09:00' });
  assert.equal(contato.ok, true, contato.erro);
  const resposta = ctx.apiResponderInterconsulta({ id: i.id, atendimento_id: contato.dados.atendimentos[0].id });
  assert.equal(resposta.ok, true, resposta.erro);
  const respondida = resposta.dados.interconsultas[0];
  assert.equal(respondida.prazo_horas, '24');
  assert.equal(respondida.prazo_resposta, '2026-11-03 10:00');
  assert.equal(respondida.resposta_no_prazo, 'SIM');
  assert.equal(respondida.horas_resposta, 23);
  ctx.novaExecucao();
  const painel = ctx.apiIndicadores({ ano: 2026, mes: 10 });
  assert.equal(painel.dados.interconsultas.resumo.percentual, 1);
  const compilado = ctx.apiCompilado({ ano: 2026, mes: 10, eixo: 'UNIDADE' });
  const sec = compilado.dados.secoes.find(s => s.titulo === 'Resposta à solicitação no prazo da prioridade');
  assert.equal(sec.linhas.find(l => l.rotulo.startsWith('MÉDIA DE HORAS ÚTEIS')).total, 23);
});

test('transferência muda localização e filtros atuais, preservando admissão, prazos e unidades históricas', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender, unidade } = sis;
  const uti = ctx.listar('UNIDADES').find(u => u.nome === 'UTI 1');
  const adm = admitir({ unidade_id: uti.id }).dados.admissao;
  const anterior = atender(adm);
  assert.equal(anterior.ok, true, anterior.erro);
  const original = JSON.stringify(ctx.buscarPorId('ADMISSOES', adm.id));
  const t = ctx.apiTransferirPaciente({ admissao_id: adm.id, setor_id: unidade.setor_id, unidade_id: unidade.id, data: '2026-10-19', hora: '08:00' });
  assert.equal(t.ok, true, t.erro);
  assert.equal(t.dados.admissao.unidade_id, uti.id);
  assert.equal(t.dados.admissao.unidade_atual_id, unidade.id);
  assert.equal(t.dados.admissao.setor_atual_id, unidade.setor_id);
  assert.equal(t.dados.transferencias[0].origem_unidade_id, uti.id);
  assert.equal(t.dados.transferencias[0].destino_unidade_id, unidade.id);
  assert.equal(JSON.stringify(ctx.buscarPorId('ADMISSOES', adm.id)), original);
  assert.equal(t.dados.atendimentos[0].unidade_id, uti.id);
  ctx.novaExecucao();
  assert.equal(ctx.apiGestao({ unidade_id: uti.id }).dados.itens.length, 0);
  assert.equal(ctx.apiGestao({ setor_id: unidade.setor_id }).dados.itens[0].unidade_id, unidade.id);
  assert.equal(ctx.apiListarAdmissoes({ unidade_id: uti.id }).dados.length, 1);
  const novo = atender(adm, { data: '2026-10-20' });
  assert.equal(novo.ok, true, novo.erro);
  assert.equal(novo.dados.atendimentos[0].unidade_id, unidade.id);
  assert.equal(novo.dados.atendimentos[0].unidade_nome, unidade.nome);
  const c = ctx.apiCompilado({ ano: 2026, mes: 10, eixo: 'UNIDADE' });
  assert.equal(c.ok, true, c.erro);
  const sec = c.dados.secoes.find(s => s.titulo === 'Atendimentos');
  const linha = sec.linhas.find(l => l.rotulo === 'PACIENTE (atendimentos)');
  const pos = nome => c.dados.colunas.findIndex(u => u.nome === nome);
  assert.equal(linha.valores[pos(uti.nome)], 1);
  assert.equal(linha.valores[pos(unidade.nome)], 1);
});

test('localização por data/hora e unidade informada no atendimento não transferem o paciente', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender, unidade } = sis;
  const destino = ctx.listar('UNIDADES').find(u => u.nome === 'UTI 1');
  const adm = admitir().dados.admissao;
  assert.equal(ctx.apiTransferirPaciente({ admissao_id: adm.id, unidade_id: destino.id, data: '2026-10-19', hora: '10:00' }).ok, true);
  const antes = atender(adm, { data: '2026-10-19', hora: '09:00' });
  assert.equal(antes.ok, true, antes.erro);
  assert.equal(ctx.listar('ATENDIMENTOS').at(-1).unidade_id, unidade.id);
  const depois = atender(adm, { data: '2026-10-19', hora: '11:00' });
  assert.equal(depois.ok, true, depois.erro);
  assert.equal(ctx.listar('ATENDIMENTOS').at(-1).unidade_id, destino.id);
  const foraDaUnidade = atender(adm, { data: '2026-10-20', unidade_id: unidade.id });
  assert.equal(foraDaUnidade.ok, true, foraDaUnidade.erro);
  assert.equal(ctx.listar('ATENDIMENTOS').at(-1).unidade_id, unidade.id);
  assert.equal(foraDaUnidade.dados.admissao.unidade_atual_id, destino.id);
  assert.equal(atender(adm, { unidade_id: 'inexistente' }).ok, false);
});

test('transferências validam destino, ordem, acesso e saída hospitalar; alta psicológica mantém movimentação', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir, unidade, desfecho } = sis;
  const adm = admitir().dados.admissao;
  const destino = ctx.listar('UNIDADES').find(u => u.nome === 'UTI 1');
  const base = { admissao_id: adm.id, unidade_id: destino.id, data: '2026-10-19', hora: '10:00' };
  for (const extra of [{ unidade_id: unidade.id }, { unidade_id: 'inválida' }, { data: '2026-10-08' },
    { data: '2026-10-21' }, { hora: '' }, { setor_id: unidade.setor_id }]) {
    assert.equal(ctx.apiTransferirPaciente({ ...base, ...extra }).ok, false, JSON.stringify(extra));
  }
  assert.equal(ctx.listar('TRANSFERENCIAS').length, 0);
  assert.equal(ctx.apiTransferirPaciente(base).ok, true);
  assert.equal(ctx.apiTransferirPaciente({ ...base, unidade_id: unidade.id, hora: '09:00' }).ok, false);
  assert.equal(ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-19' }).ok, true);
  assert.equal(ctx.apiTransferirPaciente({ ...base, unidade_id: unidade.id, hora: '11:00' }).ok, true);
  assert.equal(ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-20' }).ok, true);
  assert.equal(ctx.apiTransferirPaciente({ ...base, data: '2026-10-20' }).ok, false);
  google.sessao.email = 'semacesso@exemplo.com';
  assert.equal(ctx.apiTransferirPaciente(base).ok, false);
});

test('atividades, solicitações e novos desfechos usam a unidade na data do evento após transferência', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, desfecho } = sis;
  const adm = admitir().dados.admissao;
  const destino = ctx.listar('UNIDADES').find(u => u.nome === 'UTI 1');
  ctx.apiTransferirPaciente({ admissao_id: adm.id, unidade_id: destino.id, data: '2026-10-19', hora: '10:00' });
  const solicitacao = solicitar(sis, adm, { data_solicitacao: '2026-10-20' });
  assert.equal(solicitacao.ok, true, solicitacao.erro);
  assert.equal(solicitacao.dados.interconsultas[0].unidade_id, destino.id);
  const atividade = ctx.apiRegistrarAtividade({ admissao_id: adm.id, data: '2026-10-20', tipo: 'DISCUSSÃO DE CASO' });
  assert.equal(atividade.ok, true, atividade.erro);
  assert.equal(atividade.dados.atividades[0].unidade_id, destino.id);
  const saida = ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-20' });
  assert.equal(saida.ok, true, saida.erro);
  assert.equal(saida.dados.desfechos[0].unidade_id, destino.id);
  assert.equal(saida.dados.admissao.unidade_id, adm.unidade_id);
});

test('banco existente sem histórico mantém unidade original e nova internação não herda transferências', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir, unidade, desfecho } = sis;
  const adm = admitir().dados.admissao;
  google.planilha.deleteSheet(google.planilha.getSheetByName('TRANSFERENCIAS'));
  ctx.novaExecucao();
  const det = ctx.apiObterAdmissao(adm.id);
  assert.equal(det.ok, true, det.erro);
  assert.equal(det.dados.transferencias.length, 0);
  assert.equal(det.dados.admissao.unidade_atual_id, unidade.id);
  const destino = ctx.listar('UNIDADES').find(u => u.nome === 'UTI 1');
  ctx.apiTransferirPaciente({ admissao_id: adm.id, unidade_id: destino.id, data: '2026-10-19', hora: '10:00' });
  ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-20' });
  const nova = admitir({ data_admissao: '2026-10-20' });
  assert.equal(nova.ok, true, nova.erro);
  assert.equal(nova.dados.transferencias.length, 0);
  assert.equal(nova.dados.admissao.unidade_atual_id, unidade.id);
  assert.equal(ctx.apiObterAdmissao(adm.id).dados.admissao.unidade_atual_id, destino.id);
});

test('indicadores: API autentica, valida filtros, exclui interconsultas apagadas e respeita início oficial', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir } = sis;
  const adm = admitir().dados.admissao;
  const i = solicitar(sis, adm).dados.interconsultas[0];
  const filtros = { ano: 2026, mes: 10 };
  const r = ctx.apiIndicadores(filtros);
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.inicio_primeiro, '2026-11-03');
  assert.equal(r.dados.primeiro.resumo.fora_escopo, 1);
  assert.equal(r.dados.primeiro.resumo.percentual, null);
  assert.equal(r.dados.interconsultas.resumo.total, 1);
  assert.equal(ctx.apiIndicadores({ ...filtros, unidade_id: 'inexistente' }).ok, false);
  assert.equal(ctx.apiIndicadores({ ...filtros, mes: 13 }).ok, false);
  assert.equal(ctx.apiIndicadores({ ...filtros, ano: 2026.5 }).ok, false);
  const excluido = ctx.apiExcluirInterconsulta(i.id);
  assert.equal(excluido.ok, true, excluido.erro);
  ctx.novaExecucao();
  assert.equal(ctx.apiIndicadores(filtros).dados.interconsultas.resumo.total, 0);
  google.sessao.email = 'semacesso@exemplo.com';
  assert.equal(ctx.apiIndicadores(filtros).ok, false);
});

test('interconsultas: duas solicitações na mesma admissão conservam prazos e respostas independentes', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  const adm = admitir().dados.admissao;
  assert.equal(atender(adm).ok, true); // atendimento anterior à solicitação não responde a ela
  const primeira = solicitar(sis, adm);
  assert.equal(primeira.ok, true, primeira.erro);
  const i1 = primeira.dados.interconsultas[0];
  const moderada = ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.nome === 'CUIDADOS PALIATIVOS');
  const segunda = solicitar(sis, adm, { motivo_solicitacao_id: moderada.id, data_solicitacao: '2026-10-20', hora_solicitacao: '09:00' });
  assert.equal(segunda.ok, true, segunda.erro);
  const i2 = segunda.dados.interconsultas.find(i => i.id !== i1.id);
  assert.equal(i1.prazo_resposta, '2026-10-20 08:00');
  assert.equal(i2.prazo_resposta, '2026-10-22 09:00');
  assert.equal(ctx.apiGestao({}).dados.resumo.interconsultas_pendentes, 2);
  assert.equal(ctx.apiInterconsultas({ situacao: 'PENDENTES' }).dados.itens.length, 2);
  const resposta = atender(adm, { data: '2026-10-20', hora: '10:00', interconsulta_id: i2.id });
  assert.equal(resposta.ok, true, resposta.erro);
  assert.equal(resposta.dados.interconsultas.find(i => i.id === i1.id).momento_resposta, '');
  const respondida = resposta.dados.interconsultas.find(i => i.id === i2.id);
  assert.equal(respondida.horas_resposta, 1);
  assert.equal(respondida.resposta_no_prazo, 'SIM');
  assert.equal(ctx.apiInterconsultas({ situacao: 'RESPONDIDAS' }).dados.itens.length, 1);
  assert.equal(ctx.apiGestao({}).dados.resumo.interconsultas_pendentes, 1);
  const tarde = atender(adm, { data: '2026-10-20', hora: '11:00', interconsulta_id: i1.id });
  assert.equal(tarde.ok, true, tarde.erro);
  assert.equal(tarde.dados.interconsultas.find(i => i.id === i1.id).resposta_no_prazo, 'NÃO');
  const terceiro = solicitar(sis, adm, { data_solicitacao: '2026-10-20', hora_solicitacao: '11:30' });
  assert.equal(terceiro.dados.interconsultas.length, 3);
  assert.equal(terceiro.dados.interconsultas[2].momento_resposta, '');
  assert.equal(terceiro.dados.interconsultas[2].prazo_resposta, '2026-10-21 11:30');
});

test('interconsultas: vínculo explícito valida admissão, horário, público e exclusão reabre a solicitação', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  const adm = admitir().dados.admissao;
  const i = solicitar(sis, adm).dados.interconsultas[0];
  const anterior = atender(adm, { interconsulta_id: i.id });
  assert.equal(anterior.ok, false);
  assert.match(anterior.erro, /antes da solicitação/);
  const familia = atender(adm, { data: '2026-10-19', interconsulta_id: i.id, publico: 'FAMÍLIA', paciente_impossibilitado: 'NÃO' });
  assert.equal(familia.ok, false);
  assert.match(familia.erro, /não responde/);
  const rotina = atender(adm, { data: '2026-10-19', hora: '09:00' });
  assert.equal(rotina.dados.interconsultas[0].momento_resposta, '');
  const at = rotina.dados.atendimentos[0];
  const errada = ctx.validarRespostaInterconsulta_;
  assert.throws(() => errada(i.id, { ...at, admissao_id: 'outra' }), /não pertence/);
  const resposta = ctx.apiResponderInterconsulta({ id: i.id, atendimento_id: at.id });
  assert.equal(resposta.ok, true, resposta.erro);
  assert.equal(resposta.dados.interconsultas[0].momento_resposta, '2026-10-19 09:00');
  assert.equal(ctx.apiResponderInterconsulta({ id: i.id, atendimento_id: at.id }).ok, false);
  const removido = ctx.apiExcluirAtendimento(at.id);
  assert.equal(removido.ok, true, removido.erro);
  assert.equal(removido.dados.interconsultas[0].pendente, true);
});

test('interconsultas: aceita nova solicitação após alta psicológica e bloqueia depois da saída hospitalar', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, desfecho } = sis;
  const adm = admitir({ desfecho_id: desfecho('ALTA PSICOLÓGICA').id, data_desfecho: '2026-10-18' }).dados.admissao;
  const pedido = solicitar(sis, adm);
  assert.equal(pedido.ok, true, pedido.erro);
  assert.equal(pedido.dados.interconsultas[0].pendente, true);
  assert.equal(ctx.apiGestao({}).dados.itens[0].prazos.interconsulta.estado, 'PENDENTE');
  assert.equal(ctx.apiGestao({}).dados.resumo.interconsultas_pendentes, 1);
  const saidaAntes = ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-18' });
  assert.equal(saidaAntes.ok, false);
  assert.match(saidaAntes.erro, /antes de uma interconsulta/);
  const saida = ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho('ALTA').id, data_desfecho: '2026-10-20' });
  assert.equal(saida.ok, true, saida.erro);
  assert.equal(ctx.apiInterconsultas({ situacao: 'PENDENTES' }).dados.itens.length, 0);
  assert.equal(ctx.apiInterconsultas({ situacao: 'RESPONDIDAS' }).dados.itens.length, 0);
  assert.equal(solicitar(sis, adm).ok, false);
});

test('interconsultas: migração de banco antigo é aditiva, idempotente e preserva resposta histórica', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir, atender } = sis;
  const motivo = ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.nome === 'RISCO DE SUICÍDIO');
  const adm = admitir({ tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: motivo.id,
    data_solicitacao: '2026-10-14', hora_solicitacao: '08:00' }).dados.admissao;
  atender(adm);
  google.planilha.deleteSheet(google.planilha.getSheetByName('INTERCONSULTAS'));
  ctx.novaExecucao();
  const antes = JSON.stringify(ctx.listar('ADMISSOES'));
  const primeira = ctx.apiObterAdmissao(adm.id);
  assert.equal(primeira.ok, true, primeira.erro);
  assert.equal(primeira.dados.interconsultas[0].momento_resposta, '2026-10-14 10:00');
  assert.equal(primeira.dados.interconsultas[0].resposta_no_prazo, 'SIM');
  for (let n = 0; n < 3; n++) { ctx.novaExecucao(); ctx.apiObterAdmissao(adm.id); }
  assert.equal(ctx.listar('INTERCONSULTAS').length, 1);
  assert.equal(JSON.stringify(ctx.listar('ADMISSOES')), antes);
  solicitar(sis, adm);
  assert.equal(ctx.apiObterAdmissao(adm.id).dados.interconsultas.length, 2);
});

test('interconsultas: prioridade é preservada por solicitação e compilado usa mês da solicitação', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir } = sis;
  const adm = admitir({ data_admissao: '2026-09-01' }).dados.admissao;
  const primeira = solicitar(sis, adm).dados.interconsultas[0];
  const p = ctx.listar('PRIORIDADES').find(p => p.tipo === 'SOLICITAÇÃO' && p.nome === 'ALTA');
  ctx.apiSalvarPrioridade({ ...p, prazo: '36' });
  const segunda = solicitar(sis, adm).dados.interconsultas[1];
  assert.equal(ctx.apiObterAdmissao(adm.id).dados.interconsultas[0].prazo_resposta, primeira.prazo_resposta);
  assert.equal(segunda.prazo_resposta, '2026-10-20 20:00');
  const c = ctx.apiCompilado({ ano: 2026, mes: 10, eixo: 'UNIDADE' });
  assert.equal(c.ok, true, c.erro);
  const sec = t => c.dados.secoes.find(s => s.titulo.startsWith(t));
  assert.equal(sec('Admissões').linhas[0].total, 0);
  assert.equal(sec('Tipo de solicitação').linhas.find(l => l.rotulo === 'EQUIPE').total, 2);
  assert.equal(sec('Prioridade da solicitação').linhas.find(l => l.rotulo === 'ALTA').total, 2);
  const resposta = sec('Resposta à solicitação');
  assert.equal(resposta.linhas.find(l => l.rotulo === 'FORA DO PRAZO').total, 1);
});

test('interconsultas: valida datas, motivo e familiar sem gravar solicitação inválida', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir } = sis;
  const adm = admitir().dados.admissao;
  for (const extra of [{ data_solicitacao: '2026-10-08' }, { data_solicitacao: '2026-10-21' },
    { hora_solicitacao: '' }, { motivo_solicitacao_id: 'inexistente' }, { para_quem: 'FAMILIAR' }]) {
    assert.equal(solicitar(sis, adm, extra).ok, false);
  }
  assert.equal(ctx.listar('INTERCONSULTAS').length, 0);
  const familiar = solicitar(sis, adm, { para_quem: 'FAMILIAR', familiar_nome: 'Pessoa Teste' });
  assert.equal(familiar.ok, true, familiar.erro);
  assert.equal(familiar.dados.interconsultas[0].familiar_nome, 'PESSOA TESTE');
});

test('interconsultas: sem prazo continua pendente até resposta e fica fora do percentual de pontualidade', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  const adm = admitir().dados.admissao;
  const motivo = ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.nome === 'TRIAGEM PSICOLÓGICA');
  const pedido = solicitar(sis, adm, { motivo_solicitacao_id: motivo.id });
  assert.equal(pedido.ok, true, pedido.erro);
  const i = pedido.dados.interconsultas[0];
  assert.equal(i.resposta_no_prazo, 'SEM PRAZO');
  assert.equal(ctx.apiInterconsultas({ situacao: 'PENDENTES' }).dados.resumo.pendentes, 1);
  const r = atender(adm, { data: '2026-10-19', interconsulta_id: i.id });
  assert.equal(r.ok, true, r.erro);
  const resumo = ctx.apiInterconsultas({ situacao: 'RESPONDIDAS' }).dados.resumo;
  assert.equal(resumo.respondidas, 1);
  assert.equal(resumo.respondidas_com_prazo, 0);
  assert.equal(resumo.no_prazo, 0);
});

test('pacientes: sexo e nascimento são salvos, retornam na busca e são preservados quando omitidos', () => {
  const { ctx } = sistemaComAdmissao();
  const r = ctx.apiSalvarPaciente({ prontuario: '987654', nome: 'Paciente Teste', sexo: 'feminino', data_nascimento: '29/02/2000' });
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.sexo, 'FEMININO');
  assert.equal(r.dados.data_nascimento, '2000-02-29');
  ctx.novaExecucao();
  const editado = ctx.apiSalvarPaciente({ id: r.dados.id, prontuario: '987654', nome: 'Nome Corrigido' });
  assert.equal(editado.ok, true, editado.erro);
  assert.equal(editado.dados.sexo, 'FEMININO');
  assert.equal(editado.dados.data_nascimento, '2000-02-29');
  ctx.novaExecucao();
  const listado = ctx.apiListarPacientes({ termo: '987654' }).dados.pacientes[0];
  assert.equal(listado.data_nascimento, '2000-02-29');
  assert.equal(ctx.apiBuscarPacientes('987654').dados[0].sexo, 'FEMININO');
  const limpo = ctx.apiSalvarPaciente({ ...listado, sexo: '', data_nascimento: '' });
  assert.equal(limpo.ok, true, limpo.erro);
  assert.equal(limpo.dados.sexo, '');
  assert.equal(limpo.dados.data_nascimento, '');
});

test('pacientes: rejeita nascimento inválido ou futuro e sexo desconhecido, aceita recém-nascido', () => {
  const { ctx } = sistemaComAdmissao();
  for (const data of ['2001-02-29', '2026-13-01', '2026-10-21', '2000-01-01lixo']) {
    const r = ctx.apiSalvarPaciente({ prontuario: '987654', nome: 'Teste', data_nascimento: data });
    assert.equal(r.ok, false, data);
    assert.match(r.erro, /nascimento/);
  }
  assert.equal(ctx.apiSalvarPaciente({ prontuario: '987654', nome: 'Teste', sexo: 'inválido' }).ok, false);
  assert.equal(ctx.apiBuscarPacientes('987654').dados.length, 0);
  const r = ctx.apiSalvarPaciente({ prontuario: '987654', nome: 'Teste', sexo: 'MASCULINO', data_nascimento: ctx.hoje() });
  assert.equal(r.ok, true, r.erro);
});

test('pacientes: banco antigo recebe colunas ao final sem alterar registros, IDs ou datas existentes', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  const aba = google.planilha.getSheetByName('PACIENTES');
  const original = ['paciente-antigo', '12345', 'PACIENTE ANTIGO', '2026-01-01T12:00:00Z', '2026-02-01T12:00:00Z'];
  aba.linhas = [['id', 'prontuario', 'nome', 'criado_em', 'atualizado_em'], original.slice()];
  for (let n = 0; n < 2; n++) {
    ctx.novaExecucao();
    const r = ctx.apiListarPacientes({});
    assert.equal(r.ok, true, r.erro);
    assert.equal(r.dados.pacientes[0].sexo, '');
    assert.equal(r.dados.pacientes[0].data_nascimento, '');
    assert.deepEqual(aba.linhas[1].slice(0, 5), original);
    assert.deepEqual(aba.linhas[0].slice(5), ['sexo', 'data_nascimento']);
  }
  const r = ctx.apiSalvarPaciente({ id: original[0], prontuario: '12345', nome: original[2], sexo: 'INTERSEXO', data_nascimento: '2000-01-01' });
  assert.equal(r.ok, true, r.erro);
  assert.equal(aba.linhas[1][0], original[0]);
  assert.equal(aba.linhas[1][3], original[3]);
  assert.equal(aba.linhas[1][5], 'INTERSEXO');
  assert.equal(aba.linhas[1][6], '2000-01-01');
});

test('interconsulta é sempre da equipe, inclusive quando o cliente omite ou envia outro tipo', () => {
  const sis = sistemaComAdmissao();
  const adm = sis.admitir().dados.admissao;
  for (const tipo_solicitacao of [undefined, 'BUSCA ATIVA', 'ESPONTÂNEA']) {
    const r = solicitar(sis, adm, { tipo_solicitacao });
    assert.equal(r.ok, true, r.erro);
    const i = r.dados.interconsultas.at(-1);
    assert.equal(i.tipo_solicitacao, 'EQUIPE');
    assert.equal(i.prazo_resposta, '2026-10-20 08:00');
  }
});

test('atendimentos: ativos e inativos consideram qualquer desfecho vigente, inclusive saída hospitalar', () => {
  for (const nome of ['ALTA', 'ÓBITO', 'TRANSFERÊNCIA', 'SEM CONDIÇÕES CLÍNICAS E/OU SOCIAIS', 'ALTA PSICOLÓGICA', 'RECUSA']) {
    const sis = sistemaComAdmissao();
    const { ctx, admitir, desfecho } = sis;
    const adm = admitir().dados.admissao;
    assert.equal(ctx.apiGestao({ status_atendimento: 'ATIVOS' }).dados.itens.length, 1);
    const salvo = ctx.apiSalvarDesfechoAdmissao({ id: adm.id, desfecho_id: desfecho(nome).id, data_desfecho: '2026-10-18' });
    assert.equal(salvo.ok, true, salvo.erro);
    if (desfecho(nome).encerra_admissao !== 'SIM') assert.equal(solicitar(sis, adm).ok, true);
    assert.equal(ctx.apiGestao({ status_atendimento: 'ATIVOS' }).dados.itens.length, 0, nome);
    assert.equal(ctx.apiGestao({ status_atendimento: 'INATIVOS' }).dados.itens[0].id, adm.id, nome);
    assert.equal(ctx.apiGestao({ status_atendimento: 'TODOS' }).dados.itens.length, 1, nome);
    assert.equal(ctx.apiGestao({ status_atendimento: 'INATIVOS', unidade_id: 'outra' }).dados.itens.length, 0);
    if (desfecho(nome).encerra_admissao !== 'SIM') {
      const retomada = ctx.apiRetomarAcompanhamento({ id: adm.id, data: '2026-10-20' });
      assert.equal(retomada.ok, true, retomada.erro);
      assert.equal(ctx.apiGestao({ status_atendimento: 'ATIVOS' }).dados.itens.length, 1);
      assert.equal(ctx.apiGestao({ status_atendimento: 'INATIVOS' }).dados.itens.length, 0);
    }
  }
});

test('atendimentos: tipo de situação é obrigatório, persiste e exige vínculo somente para interconsulta', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  const adm = admitir().dados.admissao;
  const i = solicitar(sis, adm).dados.interconsultas[0];
  for (const extra of [{ tipo_atendimento: '' }, { tipo_atendimento: 'EQUIPE' }, { tipo_atendimento: 'INTERCONSULTA' },
    { tipo_atendimento: 'BUSCA ATIVA', interconsulta_id: i.id }, { tipo_atendimento: 'ESPONTÂNEA', interconsulta_id: i.id }]) {
    const r = atender(adm, extra);
    assert.equal(r.ok, false, JSON.stringify(extra));
  }
  assert.equal(ctx.listar('ATENDIMENTOS').length, 0);
  for (const tipo_atendimento of ['BUSCA ATIVA', 'ESPONTÂNEA']) {
    const r = atender(adm, { tipo_atendimento });
    assert.equal(r.ok, true, r.erro);
    assert.equal(ctx.listar('ATENDIMENTOS').at(-1).tipo_atendimento, tipo_atendimento);
  }
  const r = atender(adm, { data: '2026-10-19', tipo_atendimento: 'INTERCONSULTA', interconsulta_id: i.id });
  assert.equal(r.ok, true, r.erro);
  assert.equal(ctx.listar('ATENDIMENTOS').at(-1).tipo_atendimento, 'INTERCONSULTA');
  assert.equal(r.dados.interconsultas[0].momento_resposta, '2026-10-19 10:00');
});

test('atendimentos: acrescenta tipo no banco antigo sem inventar situação para registros históricos', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir, atender } = sis;
  const adm = admitir().dados.admissao;
  atender(adm);
  const aba = google.planilha.getSheetByName('ATENDIMENTOS');
  aba.linhas.forEach(l => l.pop());
  const original = aba.linhas[1].slice();
  ctx.novaExecucao();
  const l = ctx.listar('ATENDIMENTOS');
  assert.equal(l[0].tipo_atendimento, '');
  assert.deepEqual(aba.linhas[1], original);
  assert.equal(aba.linhas[0].at(-1), 'tipo_atendimento');
  const r = atender(adm, { tipo_atendimento: 'ESPONTÂNEA' });
  assert.equal(r.ok, true, r.erro);
  assert.equal(ctx.listar('ATENDIMENTOS').at(-1).tipo_atendimento, 'ESPONTÂNEA');
});

test('excluir interconsulta remove só a solicitação escolhida dos prazos e indicadores', () => {
  const sis = sistemaComAdmissao();
  const { ctx, admitir, atender } = sis;
  const adm = admitir().dados.admissao;
  const i1 = solicitar(sis, adm).dados.interconsultas[0];
  const i2 = solicitar(sis, adm).dados.interconsultas[1];
  const atendimento = atender(adm, { data: '2026-10-19', interconsulta_id: i1.id });
  assert.equal(atendimento.ok, true, atendimento.erro);
  const antes = JSON.stringify(ctx.listar('ATENDIMENTOS'));
  const removida = ctx.apiExcluirInterconsulta(i1.id);
  assert.equal(removida.ok, true, removida.erro);
  assert.equal(removida.dados.interconsultas.length, 1);
  assert.equal(removida.dados.interconsultas[0].id, i2.id);
  assert.equal(JSON.stringify(ctx.listar('ATENDIMENTOS')), antes);
  ctx.novaExecucao();
  assert.equal(ctx.apiInterconsultas({ situacao: 'TODAS' }).dados.itens.length, 1);
  const compilado = ctx.apiCompilado({ ano: 2026, mes: 10, eixo: 'UNIDADE' });
  assert.equal(compilado.dados.secoes.find(s => s.titulo === 'Tipo de solicitação').linhas.find(l => l.rotulo === 'EQUIPE').total, 1);
  const ultima = ctx.apiExcluirInterconsulta(i2.id);
  assert.equal(ultima.ok, true, ultima.erro);
  assert.equal(ultima.dados.interconsultas.length, 0);
  assert.equal(ctx.apiGestao({}).dados.resumo.interconsultas_pendentes, 0);
  assert.equal(ctx.apiExcluirInterconsulta(i2.id).ok, false);
  assert.equal(ctx.apiResponderInterconsulta({ id: i1.id, atendimento_id: atendimento.dados.atendimentos[0].id }).ok, false);
});

test('exclusão de interconsulta antiga não é desfeita pela migração e preserva a admissão', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir } = sis;
  const motivo = ctx.listar('MOTIVOS_SOLICITACAO').find(m => m.nome === 'RISCO DE SUICÍDIO');
  const adm = admitir({ tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: motivo.id, data_solicitacao: '2026-10-19', hora_solicitacao: '08:00' }).dados.admissao;
  const aba = google.planilha.getSheetByName('INTERCONSULTAS');
  aba.linhas.forEach(l => { l.pop(); l.pop(); }); // banco anterior sem os campos de exclusão
  ctx.novaExecucao();
  const antes = JSON.stringify(ctx.listar('ADMISSOES'));
  const r = ctx.apiExcluirInterconsulta('legado_' + adm.id);
  assert.equal(r.ok, true, r.erro);
  assert.equal(JSON.stringify(ctx.listar('ADMISSOES')), antes);
  for (let n = 0; n < 3; n++) {
    ctx.novaExecucao();
    assert.equal(ctx.apiObterAdmissao(adm.id).dados.interconsultas.length, 0);
  }
  assert.equal(ctx.listar('INTERCONSULTAS').length, 1);
  assert.ok(ctx.listar('INTERCONSULTAS')[0].excluido_em);
  assert.equal(ctx.listar('INTERCONSULTAS')[0].excluido_por, ctx.usuarioAtual().id);
});

test('exclusão de interconsulta exige autor ou coordenação e bloqueia usuário sem acesso', () => {
  const sis = sistemaComAdmissao();
  const { ctx, google, admitir } = sis;
  const adm = admitir().dados.admissao;
  const coord = google.sessao.email;
  for (const email of ['autor@exemplo.com', 'outro@exemplo.com']) {
    ctx.inserir('PROFISSIONAIS', { nome: email, email, categoria: 'PROFISSIONAL DA EMPRESA', perfil: 'PROFISSIONAL', ativo: 'SIM' });
  }
  google.sessao.email = 'autor@exemplo.com';
  const i1 = solicitar(sis, adm).dados.interconsultas[0];
  const i2 = solicitar(sis, adm).dados.interconsultas[1];
  google.sessao.email = 'outro@exemplo.com';
  const negado = ctx.apiExcluirInterconsulta(i1.id);
  assert.equal(negado.ok, false);
  assert.match(negado.erro, /quem registrou ou a coordenação/);
  google.sessao.email = 'semacesso@exemplo.com';
  assert.equal(ctx.apiExcluirInterconsulta(i1.id).ok, false);
  google.sessao.email = 'autor@exemplo.com';
  assert.equal(ctx.apiExcluirInterconsulta(i1.id).ok, true);
  google.sessao.email = coord;
  assert.equal(ctx.apiExcluirInterconsulta(i2.id).ok, true);
});

test('leitura pela API: uma consulta para todas as abas, com o mesmo resultado da leitura aba por aba', () => {
  const { ctx, admitir, atender } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  atender(adm, { publico: 'FAMÍLIA', quantidade: 2, paciente_impossibilitado: 'SIM' });
  const original = vm.runInContext('Sheets.Spreadsheets.Values.batchGet', ctx);
  let consultas = 0;
  ctx.contarConsulta = (id, op) => { consultas++; return original(id, op); };
  vm.runInContext('Sheets.Spreadsheets.Values.batchGet = contarConsulta', ctx);

  ctx.novaExecucao();
  assert.equal(ctx.apiGestao({}).ok, true);
  assert.equal(consultas, 1);
  assert.equal(vm.runInContext('_modoLeitura', ctx), 'API');

  const tudo = () => JSON.stringify(Object.keys(ctx.TABELAS).map((t) => ctx.listar(t)));
  ctx.novaExecucao();
  const pelaApi = tudo();
  vm.runInContext('_forcarLeituraPorAba = true', ctx);
  ctx.novaExecucao();
  const porAba = tudo();
  assert.equal(vm.runInContext('_modoLeitura', ctx), 'ABAS');
  assert.equal(pelaApi, porAba);
});

test('leitura pela API: se a API falhar, o sistema lê aba por aba e continua funcionando', () => {
  const { ctx, admitir } = sistemaComAdmissao();
  admitir();
  ctx.falhas = 0;
  vm.runInContext("Sheets.Spreadsheets.Values.batchGet = function () { falhas++; throw new Error('API desativada'); }", ctx);
  ctx.novaExecucao();
  const r = ctx.apiGestao({});
  assert.equal(r.ok, true, r.erro);
  assert.equal(vm.runInContext('falhas', ctx), 1); // tenta a API uma vez só por execução
  assert.equal(r.dados.itens.length, 1);
  assert.equal(vm.runInContext('_modoLeitura', ctx), 'ABAS');
});

test('leitura pela API: data que a planilha converteu em número de série volta como AAAA-MM-DD', () => {
  const { ctx, google, admitir } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  const aba = google.planilha.getSheetByName('ADMISSOES');
  const linha = aba.linhas.find((l) => l[0] === adm.id);
  linha[ctx.TABELAS.ADMISSOES.indexOf('data_admissao')] = 46315.5; // 20/10/2026 ao meio-dia
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('ADMISSOES', adm.id).data_admissao, '2026-10-20');
});

test('medição de desempenho roda as ações sem erro e não mexe no banco real', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();
  const abasAntes = google.planilha.getSheets().map((a) => a.linhas.length).join(',');
  const saida = ctx.medirDesempenho();
  assert.doesNotMatch(saida, /erro|interrompida|ATENÇÃO/, saida);
  assert.match(saida, /Registrar atendimento/);
  assert.equal(google.planilha.getSheets().map((a) => a.linhas.length).join(','), abasAntes);
  assert.equal(google.criadas.length, 1);
});

/** Conta as chamadas ao Google feitas pela função, como numa execução nova. */
function contarChamadas(ctx, fn) {
  const nomes = ['batchGet', 'append', 'batchUpdate'];
  const originais = {};
  const cont = { batchGet: 0, append: 0, batchUpdate: 0, trava: 0 };
  nomes.forEach((n) => {
    originais[n] = vm.runInContext('Sheets.Spreadsheets.Values.' + n, ctx);
    ctx['__' + n] = (...a) => { cont[n]++; return originais[n](...a); };
    vm.runInContext('Sheets.Spreadsheets.Values.' + n + ' = __' + n, ctx);
  });
  const lock = vm.runInContext('LockService.getScriptLock', ctx);
  ctx.__lock = () => { cont.trava++; return lock(); };
  vm.runInContext('LockService.getScriptLock = __lock', ctx);
  ctx.novaExecucao();
  const r = fn();
  nomes.forEach((n) => { ctx['__orig'] = originais[n]; vm.runInContext('Sheets.Spreadsheets.Values.' + n + ' = __orig', ctx); });
  ctx.__orig = lock;
  vm.runInContext('LockService.getScriptLock = __orig', ctx);
  return { r, cont };
}

test('gravação pela API: registrar atendimento lê uma vez, grava uma linha nova e atualiza o resto de uma vez', () => {
  const { ctx, admitir } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  const { r, cont } = contarChamadas(ctx, () =>
    ctx.apiRegistrarAtendimento({ tipo_atendimento: 'BUSCA ATIVA', admissao_id: adm.id, data: '2026-10-14', hora: '10:00', publico: 'PACIENTE' }));
  assert.equal(r.ok, true, r.erro);
  assert.deepEqual({ ...cont }, { batchGet: 1, append: 1, batchUpdate: 1, trava: 1 });
  assert.equal(r.dados.admissao.primeiro_atendimento, '2026-10-14');
});

test('gravação pela API: o que fica na memória depois de gravar e excluir é igual ao que está na planilha', () => {
  const { ctx, admitir, atender } = sistemaComAdmissao();
  const adm = admitir().dados.admissao;
  atender(adm, { data: '2026-10-13' });
  const tudo = () => JSON.stringify(Object.keys(ctx.TABELAS).map((t) => ctx.listar(t)));
  const verificar = (fn) => {
    ctx.novaExecucao();
    const r = fn();
    assert.equal(r.ok, true, r.erro);
    const naMemoria = tudo();
    ctx.novaExecucao();
    assert.equal(naMemoria, tudo());
    return r.dados;
  };
  const det = verificar(() => ctx.apiRegistrarAtendimento({ tipo_atendimento: 'BUSCA ATIVA', admissao_id: adm.id, data: '2026-10-15', hora: '09:00', publico: 'PACIENTE' }));
  verificar(() => ctx.apiRegistrarAtividade({ admissao_id: adm.id, data: '2026-10-15', tipo: 'DISCUSSÃO DE CASO', quantidade: 1 }));
  const primeiro = det.atendimentos.find((a) => a.data === '2026-10-13');
  const depois = verificar(() => ctx.apiExcluirAtendimento(primeiro.id));
  assert.equal(depois.atendimentos.length, 1);
  assert.equal(depois.admissao.primeiro_atendimento, '2026-10-15');
  verificar(() => ctx.apiSalvarAdmissao({ ...depois.admissao, observacoes: 'depois da exclusão' }));
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('ADMISSOES', adm.id).observacoes, 'depois da exclusão');
});

test('gravação pela API: se a operação falhar, as linhas alteradas nela não são gravadas', () => {
  const { ctx, paciente } = sistemaComAdmissao();
  ctx.novaExecucao();
  assert.throws(() => ctx.comTrava(() => {
    ctx.atualizar('PACIENTES', paciente.id, { nome: 'NOME ERRADO' });
    throw new Error('falhou no meio');
  }), /falhou no meio/);
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('PACIENTES', paciente.id).nome, paciente.nome);
});

test('gravação pela API: a operação lê de novo depois de pegar a trava e não desfaz o que outra pessoa gravou', () => {
  const { ctx, google, paciente } = sistemaComAdmissao();
  ctx.novaExecucao();
  const outro = ctx.apiSalvarPaciente({ prontuario: '777', nome: 'Outro Paciente' }).dados;
  ctx.novaExecucao();
  ctx.listar('PACIENTES'); // leitura feita antes, nesta execução
  // Outra pessoa muda o outro paciente direto na planilha.
  const aba = google.planilha.getSheetByName('PACIENTES');
  aba.linhas.find((l) => l[0] === outro.id)[ctx.TABELAS.PACIENTES.indexOf('nome')] = 'NOME MUDADO POR OUTRA PESSOA';
  const r = ctx.apiSalvarPaciente({ id: paciente.id, prontuario: paciente.prontuario, nome: 'Francisca Kelyane Souza' });
  assert.equal(r.ok, true, r.erro);
  ctx.novaExecucao();
  assert.equal(ctx.buscarPorId('PACIENTES', outro.id).nome, 'NOME MUDADO POR OUTRA PESSOA');
  assert.equal(ctx.buscarPorId('PACIENTES', paciente.id).nome, 'FRANCISCA KELYANE SOUZA');
});

test('abertura: os dados da primeira tela vão junto com a página, como JSON seguro dentro de <script>', () => {
  const { ctx, admitir } = sistemaComAdmissao();
  admitir({ observacoes: 'texto com </script><b>' });
  ctx.novaExecucao();
  const json = ctx.dadosIniciaisDaPagina();
  assert.doesNotMatch(json, /</);
  const r = JSON.parse(json);
  assert.equal(r.ok, true, r.erro);
  assert.equal(r.dados.usuario.perfil, 'COORDENAÇÃO');
  assert.ok(r.dados.unidades.length > 0);
  assert.equal(r.dados.painel.itens.length, 1);
  assert.equal(r.dados.painel.itens[0].observacoes, 'texto com </script><b>');
  const pagina = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'Index.html'), 'utf8');
  assert.match(pagina, /var DADOS_INICIAIS = <\?!= typeof dadosIniciais === 'undefined' \? 'null' : dadosIniciais \?>;/);
});

test('abertura: sem acesso, a página leva o erro para a tela mostrar', () => {
  const { ctx, google } = carregarSistema();
  ctx.configurar();
  ctx.novaExecucao();
  google.sessao.email = 'sem.cadastro@exemplo.com';
  const r = JSON.parse(ctx.dadosIniciaisDaPagina());
  assert.equal(r.ok, false);
  assert.match(r.erro, /não tem acesso/);
});
