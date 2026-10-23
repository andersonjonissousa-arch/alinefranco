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
    const r = ctx.apiRegistrarAtendimento({ admissao_id: adm.id, data: '2026-10-14', hora: '10:00', publico: 'PACIENTE', ...extra });
    ctx.novaExecucao();
    return r;
  };
  return { ...sis, j, moderada, paciente, unidade, desfecho, admitir, atender };
}

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
