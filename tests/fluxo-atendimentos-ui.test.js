// Fluxos das telas de entrada e trabalho diário, com respostas Google controladas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Elemento, descendentes } = require('./apoio/domFalso');

test('abertura usa painel da resposta inicial e voltar ao início consulta dados novos', async () => {
  const tela = carregar();
  tela.usarNavegacaoReal();
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'App.html'), 'utf8');
  vm.runInContext(html.slice(html.lastIndexOf('  // ---------- início ----------'), html.lastIndexOf('</script>')), tela.ctx);
  assert.equal(tela.pedidos.length, 1);
  assert.equal(tela.pedidos[0].nome, 'apiInicio');
  assert.deepEqual(tela.pedidos[0].args, [true]);
  await tela.responder(0, { ...cad, usuario: tela.ctx.estado.usuario, painel: gestao([]) });
  assert.equal(tela.pedidos.length, 1, 'Painel inicial dispensa segunda chamada');
  assert.match(tela.conteudo.textContent, /Nenhum paciente/);
  tela.ctx.abrir('inicio');
  assert.equal(tela.pedidos[1].nome, 'apiGestao', 'Navegação posterior sempre atualiza o painel');
});

const status = {
  aguardando: 'AGUARDANDO 1º ATENDIMENTO', acompanhamento: 'EM ACOMPANHAMENTO',
  acompanhamentoEncerrado: 'ACOMPANHAMENTO ENCERRADO', encerrada: 'ENCERRADA'
};
const paciente = { id: 'p1', nome: 'PACIENTE DE TESTE', prontuario: '123' };
const cad = {
  tipos_atendimento: ['INTERCONSULTA', 'BUSCA ATIVA', 'ESPONTÂNEA', 'SEGUIMENTO PSICOLÓGICO'],
  sexos_paciente: ['FEMININO', 'MASCULINO', 'INTERSEXO'],
  hoje: '2026-10-21', status_admissao: status, publicos: ['PACIENTE', 'FAMÍLIA'],
  setores: [{ id: 's1', nome: 'SETOR TESTE' }],
  unidades: [{ id: 'u1', nome: 'UNIDADE TESTE', setor: 'SETOR TESTE', setor_id: 's1', ativo: 'SIM' }],
  profissionais: [{ id: 'prof1', nome: 'PROFISSIONAL TESTE', categoria: 'PROFISSIONAL DA EMPRESA', ativo: 'SIM' }],
  prioridades: [{ id: 'prior1', tipo: 'SEGUIMENTO', nome: 'ALTA', prazo: 2, ativo: 'SIM' }],
  justificativas: [{ id: 'j1', nome: 'JUSTIFICATIVA TESTE', prioridade_id: 'prior1', ativo: 'SIM' }],
  motivos: [], desfechos: [{ id: 'd1', nome: 'ALTA', encerra_admissao: 'SIM', ativo: 'SIM' }],
  parametros: [], tipos_prioridade: { solicitacao: 'SOLICITAÇÃO', seguimento: 'SEGUIMENTO' },
  listas: {
    TIPO_SOLICITACAO: [{ valor: 'EQUIPE', ativo: 'SIM' }],
    DESCRICAO_DEMANDA: [{ valor: 'DEMANDA TESTE', ativo: 'SIM' }],
    NECESSIDADE_ACOMPANHAMENTO: [{ valor: 'PACIENTE', ativo: 'SIM' }, { valor: 'NÃO', ativo: 'SIM' }],
    ATIVIDADE_ASSISTENCIAL: [{ valor: 'DISCUSSÃO DE CASO', ativo: 'SIM' }]
  }
};

function detalhe(extra = {}) {
  return {
    paciente,
    admissao: {
      id: 'adm1', paciente_id: paciente.id, paciente_nome: paciente.nome, prontuario: paciente.prontuario,
      unidade_id: 'u1', unidade_nome: 'UNIDADE TESTE', setor_id: 's1', data_admissao: '2026-10-20',
      status: status.aguardando, prazo_primeiro_atendimento: '2026-10-23', primeiro_no_prazo: 'EM ANDAMENTO',
      descricao_demanda: 'DEMANDA TESTE', necessidade_acompanhamento: 'PACIENTE', justificativa_id: 'j1',
      justificativa_nome: 'JUSTIFICATIVA TESTE', para_quem: 'PACIENTE', observacoes: 'Observação da entrada',
      desfecho_nome: '', ...extra
    },
    atendimentos: [], atividades: [], desfechos: [], outras_admissoes: []
  };
}

function itemDeGestao(extra = {}) {
  return { ...detalhe(extra).admissao, dias_internado: 1, prazos: {
    primeiro: { estado: 'PENDENTE', prazo: '2026-10-21', situacao: 'VENCE HOJE' },
    interconsulta: { estado: '' }, retorno: { estado: '' },
    proximo: { tipo: '1º ATENDIMENTO', prazo: '2026-10-21', situacao: 'VENCE HOJE' }
  } };
}

function gestao(itens) {
  return { itens, hoje: cad.hoje, agora: cad.hoje + ' 12:00', resumo: {
    pacientes: itens.length, aguardando_primeiro: itens.length, interconsultas_pendentes: 0,
    atrasados: 0, vencem_hoje: itens.length
  } };
}

async function concluir() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

function carregar() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'App.html'), 'utf8');
  const inicio = html.indexOf('<script>') + '<script>'.length;
  const fim = html.lastIndexOf('  // ---------- início ----------');
  assert.ok(fim > inicio, 'Carrega definições reais antes da inicialização Google');
  const conteudo = new Elemento('main');
  conteudo.raiz = true;
  const pedidos = [], avisos = [], navegacao = [];
  const timers = new Map();
  let timer = 0;
  const ctx = vm.createContext({
    document: {
      createElement: tag => new Elemento(tag), createTextNode: texto => new Elemento('#text', texto),
      getElementById: () => conteudo, querySelectorAll: () => []
    },
    confirm: () => true,
    setTimeout: fn => { timers.set(++timer, fn); return timer; }, clearTimeout: id => timers.delete(id)
  });
  vm.runInContext(html.slice(inicio, fim), ctx);
  ctx.estado.usuario = { id: 'prof1', nome: 'PROFISSIONAL TESTE', perfil: 'COORDENAÇÃO' };
  ctx.estado.cad = JSON.parse(JSON.stringify(cad));
  ctx.chamar = (nome, ...args) => new Promise((resolve, reject) => {
    pedidos.push({ nome, args: JSON.parse(JSON.stringify(args)), resolve, reject });
  });
  ctx.avisar = (mensagem, tipo) => avisos.push({ mensagem, tipo });
  const abrirReal = ctx.abrir;
  ctx.abrir = (nome, arg) => navegacao.push({ nome, arg: arg && JSON.parse(JSON.stringify(arg)) });
  return {
    ctx, conteudo, pedidos, avisos, navegacao,
    usarNavegacaoReal() {
      ctx.abrir = (nome, arg) => {
        navegacao.push({ nome, arg: arg && JSON.parse(JSON.stringify(arg)) });
        abrirReal(nome, arg);
      };
    },
    todos: () => descendentes(conteudo),
    dispararTimers() { const pendentes = [...timers.values()]; timers.clear(); pendentes.forEach(fn => fn()); },
    async responder(indice, dados) { assert.ok(pedidos[indice], 'Consulta esperada foi realizada'); pedidos[indice].resolve(dados); await concluir(); }
  };
}

function formularioCom(tela, nome) {
  const form = tela.todos().find(el => el.tagName === 'FORM' && el.elements.some(c => c.name === nome));
  assert.ok(form, 'Formulário com campo ' + nome + ' está disponível');
  return form;
}
function formularioDaDescricao(tela) {
  // O formulário de "Editar": só a descrição (o de "A demanda mudou" tem data; o da transferência, setor).
  const form = tela.todos().find(el => el.tagName === 'FORM' && el.elements.some(c => c.name === 'descricao_demanda') &&
    !el.elements.some(c => ['publico', 'data', 'setor_id'].includes(c.name)));
  assert.ok(form, 'Formulário só da descrição da demanda está disponível');
  return form;
}
function preencher(form, nome, valor) {
  const campo = form.elements.find(el => el.name === nome);
  assert.ok(campo, 'Campo ' + nome + ' existe');
  campo.value = valor;
  return campo;
}
function botao(tela, texto) {
  const b = tela.todos().find(el => el.tagName === 'BUTTON' && texto.test(el.textContent));
  assert.ok(b, 'Botão ' + texto + ' existe');
  return b;
}

function dadosIndicadores() {
  const resumo = { total: 2, no_prazo: 1, fora_prazo: 1, avaliados: 2, percentual: 0.5,
    em_andamento: 0, nao_se_aplica: 0, sem_prazo: 0, dados_pendentes: 0, fora_escopo: 0, atrasados_abertos: 1 };
  const ind = { resumo, criterio: 'Critério de teste', grupos: [{ nome: 'JUSTIFICATIVA TESTE', resumo }],
    total_casos: 1, casos: [{ admissao_id: 'adm1', paciente_nome: 'PACIENTE TESTE', prontuario: '123', unidade_nome: 'UNIDADE TESTE',
      grupo: 'JUSTIFICATIVA TESTE', prazo: '2026-11-05', referencia: '2026-11-03', resultado: 'NÃO' }] };
  return { agora: '2026-11-20 12:00', inicio_primeiro: '2026-11-03', dias_primeiro: 3,
    primeiro: ind, interconsultas: ind, acompanhamento: ind };
}

test('lista de atendimentos mostra o prazo da interconsulta e não tem mais a coluna do 1º atendimento / retorno', () => {
  const tela = carregar();
  const d = detalhe({ primeiro_em_avaliacao: false });
  const resposta = { id: 'i1', prazo_resposta: '2026-10-23 17:50', resposta_no_prazo: 'SIM' };
  d.atendimentos = [
    { id: 'at1', data: '2026-10-22', hora: '18:10', tipo_atendimento: 'INTERCONSULTA', publico: 'PACIENTE',
      no_prazo: 'NÃO', prazo_limite: '2026-10-21', interconsultas_respondidas: [resposta],
      prazo_acompanhamento: { tipo: 'PRIMEIRO', resultado: 'FORA DO ESCOPO', prazo: '' } },
    { id: 'at2', data: '2026-10-22', hora: '18:17', tipo_atendimento: 'INTERCONSULTA', publico: 'PACIENTE',
      interconsultas_respondidas: [resposta], prazo_acompanhamento: { tipo: 'RETORNO', resultado: 'NÃO', prazo: '2026-10-21' } }
  ];
  tela.conteudo.appendChild(tela.ctx.listaAtendimentos(d));
  const linhas = tela.todos().filter(el => el.tagName === 'TR').slice(1);
  assert.match(linhas[0].children[6].textContent, /23\/10\/2026 17:50/);
  assert.match(linhas[0].children[6].textContent, /No prazo/);
  assert.match(linhas[1].children[6].textContent, /No prazo/);
  // A coluna "Primeiro atendimento / retorno — prazo e resultado" saiu, a pedido da coordenação.
  const cabecalho = tela.todos().filter(el => el.tagName === 'TH').map(th => th.textContent);
  assert.equal(cabecalho.some(t => /Primeiro atendimento \/ retorno/.test(t)), false);
  assert.equal(linhas[0].children.length, cabecalho.length);
  assert.doesNotMatch(linhas[1].textContent, /Fora do prazo/);
  tela.ctx.desenharAtendimento(d);
  assert.match(tela.conteudo.textContent, /Fora do período de avaliação/); // continua no cabeçalho da internação
});

test('registro usa rótulo Tipo da solicitação e permite selecionar seguimento sem exigir interconsulta', () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe());
  const form = formularioCom(tela, 'publico');
  assert.match(form.textContent, /Tipo da solicitação/);
  assert.doesNotMatch(form.textContent, /Tipo de situação/);
  const tipo = form.elements.find(el => el.name === 'tipo_atendimento');
  assert.ok(tipo.children.some(el => el.value === 'SEGUIMENTO PSICOLÓGICO'));
  tipo.value = 'SEGUIMENTO PSICOLÓGICO';
  tipo.emitir('change');
  assert.equal(form.elements.find(el => el.name === 'interconsulta_id').required, false);
  form.emitir('submit');
  assert.equal(tela.pedidos[0].args[0].tipo_atendimento, 'SEGUIMENTO PSICOLÓGICO');
});

test('1º atendimento: descrição da demanda e justificativa vão no próprio registro (v27)', () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ justificativa_id: '', descricao_demanda: '' }));
  assert.doesNotMatch(tela.conteudo.textContent, /Dados do acompanhamento/);
  assert.equal(tela.todos().some(el => el.name === 'paciente_impossibilitado'), false);
  assert.equal(tela.todos().filter(el => el.tagName === 'FORM' && el.elements.some(c => c.name === 'descricao_demanda')).length, 1);
  const form = formularioCom(tela, 'publico');
  const descricao = form.elements.find(el => el.name === 'descricao_demanda');
  assert.ok(descricao);
  assert.equal(descricao.required, true);
  const justificativa = form.elements.find(el => el.name === 'justificativa_id');
  assert.ok(justificativa);
  assert.equal(justificativa.required, true);
  assert.match(tela.conteudo.textContent, /Registrar 1º atendimento/);
  preencher(form, 'descricao_demanda', 'DEMANDA TESTE');
  preencher(form, 'justificativa_id', 'j1');
  preencher(form, 'tipo_atendimento', 'BUSCA ATIVA');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiRegistrarAtendimento');
  assert.equal(tela.pedidos[0].args[0].justificativa_id, 'j1');
  assert.equal(tela.pedidos[0].args[0].descricao_demanda, 'DEMANDA TESTE');
  // Depois do 1º atendimento, o registro não pede mais a descrição; ela fica num formulário próprio.
  tela.ctx.desenharAtendimento(detalhe({ status: status.acompanhamento }));
  const registro = formularioCom(tela, 'publico');
  assert.equal(registro.elements.some(el => el.name === 'descricao_demanda'), false);
  assert.equal(registro.elements.find(el => el.name === 'justificativa_id').value, 'j1');
  assert.equal(formularioDaDescricao(tela).elements.find(el => el.name === 'descricao_demanda').value, 'DEMANDA TESTE');
});

test('localização: alteração de setor/unidade envia transferência e mantém unidade da admissão no cabeçalho', async () => {
  const tela = carregar();
  tela.ctx.estado.cad.setores.push({ id: 's2', nome: 'SETOR UTI' });
  tela.ctx.estado.cad.unidades.push({ id: 'u2', nome: 'UTI TESTE', setor_id: 's2', setor: 'SETOR UTI', ativo: 'SIM' });
  const d = detalhe({ unidade_atual_id: 'u1', unidade_atual_nome: 'UNIDADE TESTE', setor_atual_id: 's1', setor_atual_nome: 'SETOR TESTE' });
  tela.ctx.desenharAtendimento(d);
  const form = formularioCom(tela, 'setor_id');
  const setor = preencher(form, 'setor_id', 's2');
  setor.emitir('change');
  const destino = form.elements.find(el => el.name === 'unidade_id');
  assert.equal(destino.children.some(el => el.value === 'u1'), false);
  assert.equal(destino.children.some(el => el.value === 'u2'), true);
  preencher(form, 'unidade_id', 'u2');
  preencher(form, 'data', '2026-10-21');
  preencher(form, 'hora', '09:00');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiTransferirPaciente');
  assert.deepEqual(tela.pedidos[0].args[0], { admissao_id: 'adm1', setor_id: 's2', unidade_id: 'u2', data: '2026-10-21', hora: '09:00' });
  const atualizado = detalhe({ unidade_atual_id: 'u2', unidade_atual_nome: 'UTI TESTE', setor_atual_id: 's2', setor_atual_nome: 'SETOR UTI' });
  atualizado.transferencias = [{ origem_nome: 'UNIDADE TESTE', destino_nome: 'UTI TESTE', data: '2026-10-21', hora: '09:00', profissional_nome: 'TESTE' }];
  await tela.responder(0, atualizado);
  assert.match(tela.conteudo.textContent, /Setor atual SETOR UTI/);
  assert.match(tela.conteudo.textContent, /Unidade atual UTI TESTE/);
  assert.match(tela.conteudo.textContent, /Unidade da admissão UNIDADE TESTE/);
  assert.equal(formularioCom(tela, 'publico').elements.find(el => el.name === 'unidade_id').value, 'u2');
});

test('atendimento usa unidade atual e sugere unidade histórica ao alterar a data do contato', () => {
  const tela = carregar();
  tela.ctx.estado.cad.unidades.push({ id: 'u2', nome: 'UTI TESTE', setor_id: 's1', setor: 'SETOR TESTE', ativo: 'SIM' });
  const d = detalhe({ unidade_atual_id: 'u2', unidade_atual_nome: 'UTI TESTE' });
  d.transferencias = [{ data: '2026-10-21', hora: '08:00', origem_unidade_id: 'u1', destino_unidade_id: 'u2' }];
  tela.ctx.desenharAtendimento(d);
  const form = formularioCom(tela, 'publico');
  const unidade = form.elements.find(el => el.name === 'unidade_id');
  assert.equal(unidade.value, 'u2');
  const data = preencher(form, 'data', '2026-10-20');
  data.emitir('change');
  assert.equal(unidade.value, 'u1');
  preencher(form, 'hora', '09:00');
  data.value = '2026-10-21';
  data.emitir('change');
  assert.equal(unidade.value, 'u2');
  preencher(form, 'tipo_atendimento', 'BUSCA ATIVA');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiRegistrarAtendimento');
  assert.equal(tela.pedidos[0].args[0].unidade_id, 'u2');
});

test('internação encerrada permite consultar movimentações mas não oferece nova transferência', () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ status: status.encerrada }));
  assert.equal(tela.todos().some(el => el.tagName === 'BUTTON' && el.textContent === 'Alterar setor/unidade atual'), false);
  assert.match(tela.conteudo.textContent, /Localização atual e transferências internas/);
});

test('indicadores: navegação independente mostra três percentuais, grupos e abre atendimento do caso', async () => {
  const tela = carregar();
  tela.usarNavegacaoReal();
  tela.ctx.abrir('indicadores');
  assert.equal(tela.pedidos[0].nome, 'apiIndicadores');
  assert.equal(tela.pedidos[0].args[0].mes, '10');
  await tela.responder(0, dadosIndicadores());
  assert.match(tela.conteudo.textContent, /Primeiro atendimento/);
  assert.match(tela.conteudo.textContent, /Interconsultas por prioridade/);
  assert.match(tela.conteudo.textContent, /Acompanhamento por justificativa/);
  assert.match(tela.conteudo.textContent, /50%/);
  assert.match(tela.conteudo.textContent, /03\/11\/2026/);
  const linha = tela.todos().find(el => el.tagName === 'TR' && el.className === 'clicavel');
  linha.emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'adm1' } });
});

test('indicadores: filtros e respostas obsoletas respeitam a seleção mais recente; vazio não apresenta zero por cento', async () => {
  const tela = carregar();
  tela.ctx.telaIndicadores();
  const form = formularioCom(tela, 'mes');
  preencher(form, 'mes', '2026-11');
  preencher(form, 'setor_id', 's1');
  preencher(form, 'unidade_id', 'u1');
  form.emitir('change');
  assert.deepEqual(tela.pedidos[1].args[0], { ano: '2026', mes: '11', setor_id: 's1', unidade_id: 'u1', termo: '' });
  const vazio = dadosIndicadores();
  for (const k of ['primeiro', 'interconsultas', 'acompanhamento']) {
    vazio[k] = { criterio: 'Nenhum caso', casos: [], grupos: [], total_casos: 0,
      resumo: { total: 0, no_prazo: 0, fora_prazo: 0, avaliados: 0, percentual: null, em_andamento: 0 } };
  }
  await tela.responder(1, vazio);
  await tela.responder(0, dadosIndicadores());
  assert.doesNotMatch(tela.conteudo.textContent, /50%/);
  assert.match(tela.conteudo.textContent, /Sem casos avaliáveis/);
});

test('admissões: formulário salva somente entrada, sem solicitação, campos clínicos ou desfecho', async () => {
  const tela = carregar();
  let retorno;
  tela.conteudo.appendChild(tela.ctx.formularioAdmissao(detalhe().admissao, dados => { retorno = dados; }));
  const form = formularioCom(tela, 'data_admissao');
  const campos = form.elements.map(el => el.name).filter(Boolean);
  for (const nome of ['data_solicitacao', 'hora_solicitacao', 'tipo_solicitacao', 'motivo_solicitacao_id', 'para_quem', 'descricao_demanda', 'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'publico']) {
    assert.equal(campos.includes(nome), false, nome + ' pertence ao trabalho diário');
  }
  preencher(form, 'data_admissao', '2026-10-19');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiSalvarEntradaAdmissao');
  assert.equal(tela.pedidos[0].args[0].id, 'adm1');
  assert.equal(tela.pedidos[0].args[0].paciente_id, 'p1');
  assert.equal(tela.pedidos[0].args[0].data_admissao, '2026-10-19');
  assert.equal('desfecho_id' in tela.pedidos[0].args[0], false);
  await tela.responder(0, detalhe({ data_admissao: '2026-10-19' }));
  assert.equal(retorno.admissao.id, 'adm1');
});

test('admissões: nova entrada usa o paciente escolhido e mostra o ID gerado', async () => {
  const tela = carregar();
  tela.ctx.seletorPaciente = escolher => { escolher(paciente); return new Elemento('div'); };
  tela.ctx.novaAdmissao();
  const form = formularioCom(tela, 'data_admissao');
  preencher(form, 'data_admissao', '2026-10-21');
  preencher(form, 'unidade_id', 'u1');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiSalvarEntradaAdmissao');
  assert.equal(tela.pedidos[0].args[0].paciente_id, 'p1');
  assert.equal(tela.pedidos[0].args[0].id, '');
  await tela.responder(0, detalhe({ id: 'nova-admissao', data_admissao: cad.hoje }));
  assert.match(tela.conteudo.textContent, /nova-admissao/);
  assert.equal(tela.todos().some(el => el.name === 'publico'), false);
});

test('atendimentos: lista inclui aguardando avaliação e marca hoje pela entrada hospitalar', async () => {
  const tela = carregar();
  tela.ctx.telaAtendimentos();
  assert.equal(tela.pedidos[0].nome, 'apiGestao');
  const hoje = itemDeGestao({ id: 'adm-hoje', paciente_nome: 'ENTRADA DE HOJE', data_admissao: cad.hoje, criado_em: '2026-10-20T12:00:00Z' });
  const antigo = itemDeGestao({ id: 'adm-antiga', paciente_nome: 'ENTRADA ANTIGA', data_admissao: '2026-10-15', criado_em: '2026-10-21T12:00:00Z' });
  await tela.responder(0, gestao([hoje, antigo]));
  const linhas = tela.todos().filter(el => el.tagName === 'TR' && el.className && el.className.includes('clicavel'));
  assert.equal(linhas.length, 2);
  assert.match(linhas[0].textContent, /Admitido hoje/i);
  assert.doesNotMatch(linhas[1].textContent, /Admitido hoje/i);
  assert.match(linhas[0].textContent, /aguardando/i);
  linhas[0].emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'adm-hoje' } });
});

test('atendimentos: corrigir a descrição da demanda e registrar contato preserva a admissão selecionada', async () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ status: status.acompanhamento }));
  const descricao = formularioDaDescricao(tela);
  assert.equal(descricao.elements.length, 2, 'Só o campo da descrição e o botão');
  preencher(descricao, 'descricao_demanda', 'DEMANDA TESTE');
  descricao.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiSalvarDescricaoDemanda');
  assert.deepEqual({ ...tela.pedidos[0].args[0] }, { descricao_demanda: 'DEMANDA TESTE', id: 'adm1' });
  await tela.responder(0, detalhe({ status: status.acompanhamento }));
  const registro = formularioCom(tela, 'publico');
  preencher(registro, 'publico', 'FAMÍLIA').emitir('change');
  preencher(registro, 'quantidade', '3');
  registro.emitir('submit');
  assert.equal(tela.pedidos[1].nome, 'apiRegistrarAtendimento');
  assert.equal(tela.pedidos[1].args[0].admissao_id, 'adm1');
  assert.equal(tela.pedidos[1].args[0].quantidade, '3');
  const salvo = detalhe({ status: status.acompanhamento });
  salvo.atendimentos.push({ id: 'at1', data: cad.hoje, publico: 'FAMÍLIA', quantidade: 3, categoria: 'PROFISSIONAL DA EMPRESA', conta_prazo: 'SIM', profissional_nome: 'PROFISSIONAL TESTE' });
  await tela.responder(1, salvo);
  assert.match(tela.conteudo.textContent, /Atendimentos \(1\)/);
  formularioDaDescricao(tela);
  assert.equal(tela.todos().some(el => el.name === 'data_admissao'), false);
});

test('atendimentos: desfecho próprio encerra registros e mantém o histórico da internação', async () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ status: status.acompanhamento }));
  const form = formularioCom(tela, 'desfecho_id');
  preencher(form, 'desfecho_id', 'd1');
  preencher(form, 'data_desfecho', cad.hoje);
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiSalvarDesfechoAdmissao');
  assert.deepEqual(tela.pedidos[0].args[0], { id: 'adm1', desfecho_id: 'd1', data_desfecho: cad.hoje });
  const encerrado = detalhe({ status: status.encerrada, desfecho_id: 'd1', desfecho_nome: 'ALTA', data_desfecho: cad.hoje });
  encerrado.desfechos.push({ id: 'hist1', data: cad.hoje, desfecho_nome: 'ALTA', encerra_admissao: 'SIM', vigente: 'SIM', unidade_nome: 'UNIDADE TESTE' });
  await tela.responder(0, encerrado);
  assert.equal(tela.todos().some(el => el.name === 'publico'), false);
  assert.equal(tela.todos().some(el => el.name === 'tipo'), false);
  formularioDaDescricao(tela); // a descrição continua corrigível depois da saída do hospital
  assert.match(tela.conteudo.textContent, /Desfechos desta admissão/);
  assert.match(tela.conteudo.textContent, /ALTA/);
});

test('atendimentos: exclusão de contato redesenha trabalho diário sem abrir formulário de entrada', async () => {
  const tela = carregar();
  const det = detalhe({ status: status.acompanhamento });
  det.atendimentos.push({ id: 'at-remover', data: cad.hoje, publico: 'PACIENTE', categoria: 'PROFISSIONAL DA EMPRESA', profissional_nome: 'PROFISSIONAL TESTE', conta_prazo: 'SIM' });
  tela.ctx.desenharAtendimento(det);
  botao(tela, /^excluir$/).emitir('click');
  assert.equal(tela.pedidos[0].nome, 'apiExcluirAtendimento');
  assert.deepEqual(tela.pedidos[0].args, ['at-remover']);
  await tela.responder(0, detalhe());
  formularioCom(tela, 'publico');
  assert.equal(tela.todos().some(el => el.name === 'data_admissao'), false);
  assert.match(tela.conteudo.textContent, /Nenhum atendimento registrado/);
});

test('início e gestão: atalhos de pacientes abrem atendimentos da admissão correta', async () => {
  for (const telaInicial of ['inicio', 'unidades', 'prazos']) {
    const tela = carregar();
    if (telaInicial === 'inicio') tela.ctx.telaInicio();
    else if (telaInicial === 'unidades') tela.ctx.gestaoUnidades(tela.conteudo);
    else tela.ctx.gestaoPrazos(tela.conteudo);
    await tela.responder(0, gestao([itemDeGestao({ id: 'adm-atalho' })]));
    const linha = tela.todos().find(el => el.tagName === 'TR' && el.className && el.className.includes('clicavel'));
    assert.ok(linha, 'Atalho para paciente existe em ' + telaInicial);
    linha.emitir('click');
    assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'adm-atalho' } });
  }
});

test('admissões: histórico de outras internações abre seus próprios IDs sem misturar atendimentos', () => {
  const tela = carregar();
  const det = detalhe();
  det.outras_admissoes.push({ ...det.admissao, id: 'adm-anterior', data_admissao: '2026-09-01', status: status.encerrada, desfecho_nome: 'ALTA' });
  tela.ctx.desenharAdmissao(det);
  botao(tela, /Ir para atendimentos/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'adm1' } });
  const linhaAntiga = tela.todos().find(el => el.tagName === 'TR' && el.textContent.includes('adm-anterior'));
  assert.ok(linhaAntiga, 'Outra entrada do mesmo paciente aparece no histórico');
  linhaAntiga.emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'admissoes', arg: { id: 'adm-anterior' } });
  assert.equal(tela.todos().some(el => el.name === 'publico'), false);
});

test('atendimentos: setor, unidade e busca filtram na tela; só a situação busca de novo, e resposta antiga não substitui a nova', async () => {
  const tela = carregar();
  tela.ctx.telaAtendimentos();
  assert.equal(tela.pedidos.length, 1);
  assert.deepEqual(tela.pedidos[0].args[0], { status_atendimento: 'ATIVOS' });
  const form = formularioCom(tela, 'termo');
  preencher(form, 'setor_id', 's1');
  preencher(form, 'unidade_id', 'u1');
  preencher(form, 'termo', 'nova busca');
  preencher(form, 'status_atendimento', 'INATIVOS');
  form.emitir('input');
  form.emitir('change');
  // Mudou a situação: uma busca nova (e só uma), com a situação; o resto é filtrado na tela.
  assert.equal(tela.pedidos.length, 2);
  assert.equal(tela.pedidos[1].nome, 'apiGestao');
  assert.deepEqual(tela.pedidos[1].args[0], { status_atendimento: 'INATIVOS' });
  await tela.responder(0, gestao([itemDeGestao({ paciente_nome: 'RESPOSTA ANTERIOR AO FILTRO' })]));
  assert.doesNotMatch(tela.conteudo.textContent, /RESPOSTA ANTERIOR AO FILTRO/);
  await tela.responder(1, gestao([
    itemDeGestao({ id: 'a1', paciente_nome: 'NOVA BUSCA DA SILVA' }),
    itemDeGestao({ id: 'a2', paciente_nome: 'NOVA BUSCA EM OUTRA UNIDADE', unidade_id: 'u2' }),
    itemDeGestao({ id: 'a3', paciente_nome: 'OUTRO NOME' })
  ]));
  assert.match(tela.conteudo.textContent, /NOVA BUSCA DA SILVA/);
  assert.doesNotMatch(tela.conteudo.textContent, /NOVA BUSCA EM OUTRA UNIDADE|OUTRO NOME/);
  // Digitar não vai ao servidor nem espera: a lista muda na hora.
  preencher(form, 'termo', 'outro');
  form.emitir('input');
  assert.equal(tela.pedidos.length, 2);
  assert.match(tela.conteudo.textContent, /OUTRO NOME/);
  assert.doesNotMatch(tela.conteudo.textContent, /NOVA BUSCA DA SILVA/);
});

test('atendimentos: retomada reabre trabalho diário na mesma admissão hospitalar', async () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ status: status.acompanhamentoEncerrado, desfecho_nome: 'ALTA PSICOLÓGICA', data_desfecho: '2026-10-20' }));
  assert.equal(tela.todos().some(el => el.name === 'publico'), false);
  assert.equal(tela.todos().some(el => el.name === 'necessidade_acompanhamento'), false);
  const form = formularioCom(tela, 'justificativa_id');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiRetomarAcompanhamento');
  assert.equal(tela.pedidos[0].args[0].id, 'adm1');
  await tela.responder(0, detalhe({ status: status.acompanhamento }));
  formularioCom(tela, 'publico');
  assert.match(tela.conteudo.textContent, /adm1/);
  assert.equal(tela.pedidos.some(p => p.nome === 'apiSalvarEntradaAdmissao'), false);
});

test('atendimentos: salvar depois de mudar de tela não substitui a lista de admissões', async () => {
  const tela = carregar();
  tela.usarNavegacaoReal();
  tela.ctx.abrir('atendimentos', { id: 'adm1' });
  assert.equal(tela.pedidos[0].nome, 'apiObterAdmissao');
  await tela.responder(0, detalhe({ status: status.acompanhamento }));
  formularioDaDescricao(tela).emitir('submit');
  assert.equal(tela.pedidos[1].nome, 'apiSalvarDescricaoDemanda');

  // O usuário continua trabalhando enquanto a gravação ainda está pendente.
  tela.ctx.abrir('admissoes');
  assert.equal(tela.pedidos[2].nome, 'apiListarAdmissoes');
  await tela.responder(2, [detalhe().admissao]);
  const listaAtual = tela.conteudo.textContent;
  await tela.responder(1, detalhe({ status: status.acompanhamento, descricao_demanda: 'DEMANDA ATUALIZADA' }));

  assert.equal(tela.ctx.estado.tela, 'admissoes');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'admissoes', arg: undefined });
  assert.equal(tela.conteudo.textContent, listaAtual);
  assert.equal(tela.todos().some(el => el.name === 'descricao_demanda'), false);
});

test('interconsultas: formulário cria solicitação independente vinculada à admissão aberta', async () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe());
  const form = formularioCom(tela, 'data_solicitacao');
  preencher(form, 'motivo_solicitacao_id', 'motivo-alta');
  preencher(form, 'data_solicitacao', '2026-10-21');
  preencher(form, 'hora_solicitacao', '09:00');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiRegistrarInterconsulta');
  assert.equal(tela.pedidos[0].args[0].admissao_id, 'adm1');
  assert.equal(tela.pedidos[0].args[0].hora_solicitacao, '09:00');
  assert.equal('data_admissao' in tela.pedidos[0].args[0], false);
  const d = detalhe();
  d.interconsultas = [{ id: 'i1', data_solicitacao: '2026-10-21', hora_solicitacao: '09:00',
    motivo_nome: 'MOTIVO TESTE', prioridade_solicitacao: 'ALTA', pendente: true, prazo_resposta: '2026-10-22 09:00', resposta_no_prazo: 'EM ANDAMENTO' }];
  await tela.responder(0, d);
  assert.match(tela.conteudo.textContent, /Interconsultas \(1\)/);
  assert.match(tela.conteudo.textContent, /MOTIVO TESTE/);
  const atendimento = formularioCom(tela, 'publico');
  preencher(atendimento, 'interconsulta_id', 'i1');
  atendimento.emitir('submit');
  assert.equal(tela.pedidos[1].nome, 'apiRegistrarAtendimento');
  assert.equal(tela.pedidos[1].args[0].interconsulta_id, 'i1');
});

test('interconsultas: histórico mantém duas solicitações e permite vincular atendimento existente', async () => {
  const tela = carregar();
  const d = detalhe();
  d.interconsultas = [
    { id: 'i1', motivo_nome: 'PRIMEIRO MOTIVO', data_solicitacao: '2026-10-20', hora_solicitacao: '10:00', momento_resposta: '2026-10-20 11:00', resposta_no_prazo: 'SIM' },
    { id: 'i2', motivo_nome: 'SEGUNDO MOTIVO', data_solicitacao: '2026-10-21', hora_solicitacao: '08:00', pendente: true, resposta_no_prazo: 'EM ANDAMENTO' }
  ];
  d.atendimentos = [{ id: 'at1', data: '2026-10-21', hora: '09:00', publico: 'PACIENTE', profissional_nome: 'TESTE' }];
  tela.ctx.desenharAtendimento(d);
  assert.match(tela.conteudo.textContent, /Interconsultas \(2\)/);
  assert.match(tela.conteudo.textContent, /PRIMEIRO MOTIVO/);
  assert.match(tela.conteudo.textContent, /SEGUNDO MOTIVO/);
  const form = formularioCom(tela, 'atendimento_id');
  preencher(form, 'atendimento_id', 'at1');
  form.emitir('submit');
  assert.deepEqual(tela.pedidos[0].args[0], { atendimento_id: 'at1', id: 'i2' });
  assert.equal(tela.pedidos[0].nome, 'apiResponderInterconsulta');
});

test('interconsultas: alta psicológica mantém formulário; saída hospitalar exibe apenas histórico', () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ status: status.acompanhamentoEncerrado, desfecho_nome: 'ALTA PSICOLÓGICA' }));
  formularioCom(tela, 'data_solicitacao');
  botao(tela, /Retomar acompanhamento/);
  tela.ctx.desenharAtendimento(detalhe({ status: status.encerrada, desfecho_nome: 'ALTA' }));
  assert.equal(tela.todos().some(el => el.name === 'data_solicitacao'), false);
  assert.match(tela.conteudo.textContent, /Interconsultas \(0\)/);
});

test('pacientes: edição apresenta sexo e nascimento existentes e envia as correções', async () => {
  const tela = carregar();
  tela.ctx.telaPacientes();
  const p = { ...paciente, sexo: 'FEMININO', data_nascimento: '2000-02-29' };
  await tela.responder(0, { pacientes: [p], total: 1, pagina: 1, paginas: 1, tamanho_pagina: 20 });
  const linha = tela.todos().find(el => el.tagName === 'TR' && el.className === 'clicavel');
  linha.emitir('click');
  const form = formularioCom(tela, 'data_nascimento');
  assert.equal(form.elements.find(el => el.name === 'data_nascimento').value, p.data_nascimento);
  assert.equal(form.elements.find(el => el.name === 'sexo').value, 'FEMININO');
  preencher(form, 'data_nascimento', '2000-03-01');
  preencher(form, 'sexo', 'INTERSEXO');
  form.emitir('submit');
  assert.equal(tela.pedidos[1].nome, 'apiSalvarPaciente');
  assert.equal(tela.pedidos[1].args[0].data_nascimento, '2000-03-01');
  assert.equal(tela.pedidos[1].args[0].sexo, 'INTERSEXO');
});

test('pacientes: cadastro durante admissão inclui sexo e nascimento', async () => {
  const tela = carregar();
  tela.conteudo.appendChild(tela.ctx.seletorPaciente(() => {}));
  const busca = tela.todos().find(el => el.type === 'search');
  busca.value = '12345';
  busca.emitir('input');
  tela.dispararTimers();
  await tela.responder(0, []);
  const form = formularioCom(tela, 'data_nascimento');
  preencher(form, 'nome', 'PACIENTE TESTE');
  preencher(form, 'sexo', 'MASCULINO');
  preencher(form, 'data_nascimento', '1995-10-20');
  form.emitir('submit');
  assert.equal(tela.pedidos[1].nome, 'apiSalvarPaciente');
  assert.equal(tela.pedidos[1].args[0].sexo, 'MASCULINO');
  assert.equal(tela.pedidos[1].args[0].data_nascimento, '1995-10-20');
});

test('interconsulta não oferece seleção de tipo; atendimento exige situação e só exibe vínculo quando pertinente', () => {
  const tela = carregar();
  const d = detalhe();
  d.interconsultas = [{ id: 'i1', pendente: true, data_solicitacao: '2026-10-21', hora_solicitacao: '08:00', motivo_nome: 'TESTE' }];
  tela.ctx.desenharAtendimento(d);
  const solicitacao = formularioCom(tela, 'data_solicitacao');
  assert.equal(solicitacao.elements.some(el => el.name === 'tipo_solicitacao'), false);
  assert.match(solicitacao.textContent, /Solicitação da equipe/);
  const form = formularioCom(tela, 'publico');
  const tipo = form.elements.find(el => el.name === 'tipo_atendimento');
  const vinculo = form.elements.find(el => el.name === 'interconsulta_id');
  assert.equal(tipo.required, true);
  assert.equal(vinculo.required, false);
  tipo.value = 'INTERCONSULTA';
  tipo.emitir('change');
  assert.equal(vinculo.required, true);
  vinculo.value = 'i1';
  tipo.value = 'ESPONTÂNEA';
  tipo.emitir('change');
  assert.equal(vinculo.required, false);
  assert.equal(vinculo.value, '');
  form.emitir('submit');
  assert.equal(tela.pedidos[0].args[0].tipo_atendimento, 'ESPONTÂNEA');
  assert.equal(tela.pedidos[0].args[0].interconsulta_id, '');
});

test('atendimentos: começa nos ativos e permite consultar inativos e todos', () => {
  const tela = carregar();
  tela.ctx.telaAtendimentos();
  assert.equal(tela.pedidos[0].args[0].status_atendimento, 'ATIVOS');
  const form = formularioCom(tela, 'status_atendimento');
  for (const valor of ['INATIVOS', 'TODOS']) {
    preencher(form, 'status_atendimento', valor);
    form.emitir('change');
    assert.equal(tela.pedidos.at(-1).args[0].status_atendimento, valor);
  }
});

test('excluir interconsulta pede confirmação, permite cancelar e atualiza a tela após excluir', async () => {
  const tela = carregar();
  const d = detalhe();
  d.interconsultas = [{ id: 'i-excluir', criado_por: 'prof1', pendente: true, data_solicitacao: '2026-10-21', hora_solicitacao: '08:00', motivo_nome: 'TESTE' }];
  tela.ctx.desenharAtendimento(d);
  let mensagem;
  tela.ctx.confirm = texto => { mensagem = texto; return false; };
  botao(tela, /^Excluir interconsulta$/).emitir('click');
  assert.match(mensagem, /atendimentos registrados serão mantidos/);
  assert.equal(tela.pedidos.length, 0);
  tela.ctx.confirm = () => true;
  botao(tela, /^Excluir interconsulta$/).emitir('click');
  assert.equal(tela.pedidos[0].nome, 'apiExcluirInterconsulta');
  assert.equal(tela.pedidos[0].args[0], 'i-excluir');
  await tela.responder(0, detalhe());
  assert.match(tela.conteudo.textContent, /Interconsultas \(0\)/);
  assert.equal(tela.todos().some(el => el.textContent === 'Excluir interconsulta'), false);
});

test('botão de excluir interconsulta aparece só para autor ou coordenação', () => {
  const tela = carregar();
  const d = detalhe();
  d.interconsultas = [{ id: 'i1', criado_por: 'outro', data_solicitacao: '2026-10-21', hora_solicitacao: '08:00', motivo_nome: 'TESTE' }];
  tela.ctx.estado.usuario.perfil = 'PROFISSIONAL';
  tela.ctx.desenharAtendimento(d);
  assert.equal(tela.todos().some(el => el.textContent === 'Excluir interconsulta'), false);
  d.interconsultas[0].criado_por = 'prof1';
  tela.ctx.desenharAtendimento(d);
  botao(tela, /^Excluir interconsulta$/);
});

test('gestão: filtros de setor, unidade, busca e pendência não vão ao servidor; incluir desfecho psicológico busca de novo', async () => {
  const tela = carregar();
  tela.ctx.telaGestao({ aba: 'unidades' });
  assert.equal(tela.pedidos.length, 1);
  assert.deepEqual(tela.pedidos[0].args[0], { incluir_encerrados: '' });
  await tela.responder(0, gestao([
    itemDeGestao({ id: 'a1', paciente_nome: 'MARIA ATRASADA', prazos: undefined }),
    itemDeGestao({ id: 'a2', paciente_nome: 'JOAO EM DIA' })
  ].map((a, i) => i === 0 ? { ...a, prazos: { ...itemDeGestao().prazos, proximo: { tipo: 'RETORNO', prazo: '2026-10-19', situacao: 'ATRASADO' } } } : a)));
  assert.match(tela.conteudo.textContent, /MARIA ATRASADA/);
  assert.match(tela.conteudo.textContent, /JOAO EM DIA/);
  const form = formularioCom(tela, 'pendencia');
  preencher(form, 'pendencia', 'ATRASADOS');
  form.emitir('input');
  form.emitir('change');
  assert.equal(tela.pedidos.length, 1, 'Trocar a opção não busca no servidor (nem duas vezes)');
  assert.match(tela.conteudo.textContent, /MARIA ATRASADA/);
  assert.doesNotMatch(tela.conteudo.textContent, /JOAO EM DIA/);
  preencher(form, 'pendencia', '');
  preencher(form, 'termo', 'joão');
  form.emitir('input');
  assert.equal(tela.pedidos.length, 1);
  assert.match(tela.conteudo.textContent, /JOAO EM DIA/);
  assert.doesNotMatch(tela.conteudo.textContent, /MARIA ATRASADA/);
  const caixa = form.elements.find(el => el.type === 'checkbox') || tela.todos().find(el => el.type === 'checkbox');
  caixa.checked = true;
  form.emitir('change');
  assert.equal(tela.pedidos.length, 2);
  assert.deepEqual(tela.pedidos[1].args[0], { incluir_encerrados: 'SIM' });
});

test('interconsultas: uma busca só (todas, 90 dias); situação, período e prioridade filtram na tela', async () => {
  const tela = carregar();
  tela.ctx.telaGestao({ aba: 'interconsultas' });
  assert.equal(tela.pedidos.length, 1);
  assert.deepEqual(tela.pedidos[0].args[0], { situacao: 'TODAS', dias: '90' });
  const base = { ...itemDeGestao(), unidade_nome: 'UNIDADE TESTE', motivo_nome: 'MOTIVO' };
  const pendente = { ...base, id: 'a1', paciente_nome: 'PENDENTE ALTA', pendente: true, prioridade_solicitacao: 'ALTA', data_solicitacao: '2026-10-20',
    prazo_resposta: '2026-10-21 08:00', prazos: { interconsulta: { estado: 'PENDENTE', situacao: 'NO PRAZO', prazo: '2026-10-21 08:00' } } };
  const respondida = { ...base, id: 'a2', paciente_nome: 'RESPONDIDA ANTIGA', pendente: false, momento_resposta: '2026-09-01 10:00',
    prioridade_solicitacao: 'BAIXA', data_solicitacao: '2026-09-01', prazo_resposta: '2026-09-04 08:00',
    prazos: { interconsulta: { estado: 'CUMPRIDO', resultado: 'NO PRAZO', prazo: '2026-09-04 08:00' } } };
  await tela.responder(0, { itens: [pendente, respondida], dias: 90, agora: '2026-10-20 12:00', resumo: {} });
  // Padrão: aguardando resposta.
  assert.match(tela.conteudo.textContent, /PENDENTE ALTA/);
  assert.doesNotMatch(tela.conteudo.textContent, /RESPONDIDA ANTIGA/);
  const form = formularioCom(tela, 'situacao');
  preencher(form, 'situacao', 'TODAS');
  preencher(form, 'dias', '90');
  form.emitir('change');
  assert.equal(tela.pedidos.length, 1);
  assert.match(tela.conteudo.textContent, /RESPONDIDA ANTIGA/);
  preencher(form, 'dias', '30');
  form.emitir('change');
  assert.doesNotMatch(tela.conteudo.textContent, /RESPONDIDA ANTIGA/, 'Respondida há mais de 30 dias sai do período');
  assert.match(tela.conteudo.textContent, /PENDENTE ALTA/, 'Pendente aparece em qualquer período');
  preencher(form, 'prioridade', 'BAIXA');
  form.emitir('change');
  assert.doesNotMatch(tela.conteudo.textContent, /PENDENTE ALTA/);
  assert.equal(tela.pedidos.length, 1);
});

test('admissões: trocar abertas e encerradas faz uma busca só; setor e busca filtram na tela', async () => {
  const tela = carregar();
  tela.ctx.telaAdmissoes();
  assert.equal(tela.pedidos.length, 1);
  assert.deepEqual(tela.pedidos[0].args[0], { abertas: 'SIM', limite: 300 });
  await tela.responder(0, [detalhe().admissao, { ...detalhe().admissao, id: 'adm2', paciente_nome: 'OUTRA PACIENTE', prontuario: '999' }]);
  assert.match(tela.conteudo.textContent, /OUTRA PACIENTE/);
  const form = formularioCom(tela, 'abertas');
  const busca = preencher(form, 'termo', '999');
  form.listeners.input.forEach(fn => fn({ target: busca }));
  assert.equal(tela.pedidos.length, 1);
  assert.match(tela.conteudo.textContent, /OUTRA PACIENTE/);
  assert.doesNotMatch(tela.conteudo.textContent, /PACIENTE DE TESTE/);
  const abertas = preencher(form, 'abertas', 'NÃO');
  form.listeners.input.forEach(fn => fn({ target: abertas }));
  form.listeners.change.forEach(fn => fn({ target: abertas }));
  assert.equal(tela.pedidos.length, 2, 'Uma busca só ao trocar a opção');
  assert.deepEqual(tela.pedidos[1].args[0], { abertas: 'NÃO', limite: 300 });
});

function historicoDoPaciente() {
  const adm = detalhe({ status: status.encerrada, data_admissao: '2026-10-09', desfecho_nome: 'ALTA', data_desfecho: '2026-10-17', primeiro_atendimento: '2026-10-13', primeiro_no_prazo: 'SIM' }).admissao;
  return {
    paciente: { ...paciente, sexo: 'FEMININO', data_nascimento: '1980-05-02' },
    resumo: { internacoes: 2, atendimentos: 1, solicitacoes: 1, desfechos: 1 },
    internacoes: [
      { admissao: { ...adm, id: 'adm2', data_admissao: '2026-10-19', status: status.aguardando, desfecho_nome: '', primeiro_atendimento: '', primeiro_no_prazo: 'EM ANDAMENTO' }, eventos: [
        { tipo: 'ENTRADA', data: '2026-10-19', hora: '', unidade_nome: 'UNIDADE TESTE', admissao_id: 'adm2' }] },
      { admissao: adm, eventos: [
        { tipo: 'DESFECHO', data: '2026-10-17', hora: '', desfecho_nome: 'ALTA', encerra_admissao: 'SIM', vigente: 'SIM', unidade_nome: 'UNIDADE TESTE' },
        { tipo: 'TRANSFERÊNCIA', data: '2026-10-15', hora: '14:00', origem_nome: 'UNIDADE TESTE', destino_nome: 'UTI TESTE', profissional_nome: 'PROFISSIONAL TESTE' },
        { tipo: 'JUSTIFICATIVA', data: '2026-10-13', hora: '09:00', de: '', para: 'JUSTIFICATIVA TESTE', profissional_nome: 'PROFISSIONAL TESTE' },
        { tipo: 'ATENDIMENTO', data: '2026-10-13', hora: '09:00', publico: 'FAMÍLIA', quantidade: 2, profissional_nome: 'PROFISSIONAL TESTE',
          categoria: 'RESIDENTE', tipo_atendimento: 'INTERCONSULTA', justificativa_nome: 'JUSTIFICATIVA TESTE', unidade_nome: 'UNIDADE TESTE',
          tipo_prazo: 'PRIMEIRO', prazo: '2026-10-14', resultado: 'SIM', interconsultas_respondidas: ['i1'], observacao: '' },
        { tipo: 'SOLICITAÇÃO', data: '2026-10-13', hora: '08:00', solicitacao_id: 'i1', tipo_solicitacao: 'EQUIPE', motivo_nome: 'MOTIVO TESTE',
          prioridade: 'ALTA', para_quem: 'FAMILIAR', familiar_parentesco: 'MÃE', familiar_nome: '', prazo: '2026-10-14', resultado: 'SIM',
          respondida_em: '2026-10-13 09:00', dias_resposta: 0, pendente: false, observacoes: '' },
        { tipo: 'ENTRADA', data: '2026-10-09', hora: '', unidade_nome: 'UNIDADE TESTE', admissao_id: 'adm1' }] }
    ]
  };
}

test('histórico do paciente: abre da internação, mostra a linha do tempo, filtra na tela e volta para onde estava', async () => {
  const tela = carregar();
  tela.ctx.desenharAtendimento(detalhe({ status: status.acompanhamento }));
  botao(tela, /Histórico completo do paciente/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'historico', arg: { paciente_id: 'p1', voltar: { nome: 'atendimentos', arg: { id: 'adm1' } } } });

  tela.ctx.telaHistorico(tela.navegacao.at(-1).arg);
  assert.equal(tela.pedidos[0].nome, 'apiHistoricoPaciente');
  assert.deepEqual(tela.pedidos[0].args, ['p1']);
  await tela.responder(0, historicoDoPaciente());
  const texto = tela.conteudo.textContent;
  assert.match(texto, /Histórico · PACIENTE DE TESTE/);
  assert.match(texto, /Internações 2/);
  // A internação mais recente vem primeiro.
  assert.ok(texto.indexOf('Internação de 19/10/2026') !== -1 && texto.indexOf('Internação de 19/10/2026') < texto.indexOf('Internação de 09/10/2026'), texto);
  assert.match(texto, /Descrição da demanda atual DEMANDA TESTE/);
  assert.match(texto, /Atendimento a família · 2 pessoa\(s\)/);
  assert.match(texto, /por PROFISSIONAL TESTE \(residente\)/);
  assert.match(texto, /Justificativa: JUSTIFICATIVA TESTE/);
  assert.match(texto, /prioridade alta · para mãe/);
  assert.match(texto, /respondida 13\/10\/2026 09:00 \(no mesmo dia\)/);
  assert.match(texto, /UNIDADE TESTE → UTI TESTE/);
  assert.match(texto, /Definida: JUSTIFICATIVA TESTE/);
  assert.match(texto, /encerra a internação/);
  assert.match(texto, /Respondeu à solicitação de 13\/10\/2026 08:00 · MOTIVO TESTE/);
  assert.equal(tela.todos().filter(el => el.tagName === 'LI').length, 7);

  // Filtrar não vai ao servidor.
  const filtro = tela.todos().find(el => el.name === 'tipo');
  filtro.value = 'ATENDIMENTO';
  filtro.emitir('change');
  assert.equal(tela.pedidos.length, 1);
  assert.equal(tela.todos().filter(el => el.tagName === 'LI').length, 1);
  assert.match(tela.conteudo.textContent, /Nada deste tipo nesta internação/);

  botao(tela, /Abrir esta internação/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'adm2' } });
  botao(tela, /← Voltar/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'adm1' } });
});

test('histórico do paciente: link na lista de atendimentos abre o histórico sem abrir a internação', async () => {
  const tela = carregar();
  tela.ctx.telaAtendimentos();
  await tela.responder(0, gestao([itemDeGestao()]));
  const link = tela.todos().find(el => el.tagName === 'BUTTON' && el.textContent === 'histórico');
  assert.ok(link);
  link.emitir('click', { stopPropagation() {} });
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'historico', arg: { paciente_id: 'p1', voltar: { nome: 'atendimentos' } } });
  assert.equal(tela.navegacao.length, 1);
});

test('descrição da demanda: "Editar" e "A demanda mudou" ao lado da atual, e a transferência pergunta se a demanda mudou', async () => {
  const tela = carregar();
  tela.ctx.estado.cad.listas.DESCRICAO_DEMANDA.push({ valor: 'OUTRA DEMANDA', ativo: 'SIM' });
  const d = detalhe({ status: status.acompanhamento });
  d.descricoes = [{ id: 'd1', data: '2026-10-20', hora: '09:00', descricao: 'DEMANDA TESTE', origem: 'AVALIAÇÃO', unidade_nome: 'UNIDADE TESTE', profissional_nome: 'PROFISSIONAL TESTE' }];
  tela.ctx.desenharAtendimento(d);
  assert.match(tela.conteudo.textContent, /DEMANDA TESTEdesde 20\/10\/2026 · UNIDADE TESTE/);
  const editar = formularioDaDescricao(tela);
  const mudou = tela.todos().find(el => el.tagName === 'FORM' && el.elements.some(c => c.name === 'descricao_demanda') &&
    el.elements.some(c => c.name === 'data') && !el.elements.some(c => c.name === 'setor_id'));
  assert.ok(mudou);
  assert.equal(editar.hidden, true);
  assert.equal(mudou.hidden, true);
  botao(tela, /^A demanda mudou$/).emitir('click');
  assert.equal(mudou.hidden, false);
  assert.equal(editar.hidden, true);
  // A nova demanda não oferece a atual.
  assert.equal(mudou.elements.find(el => el.name === 'descricao_demanda').children.some(o => o.value === 'DEMANDA TESTE'), false);
  preencher(mudou, 'descricao_demanda', 'OUTRA DEMANDA');
  preencher(mudou, 'data', '2026-10-21');
  preencher(mudou, 'hora', '10:00');
  mudou.emitir('submit');
  assert.equal(tela.pedidos[0].nome, 'apiMudarDescricaoDemanda');
  assert.deepEqual({ ...tela.pedidos[0].args[0] }, { descricao_demanda: 'OUTRA DEMANDA', data: '2026-10-21', hora: '10:00', id: 'adm1' });
  botao(tela, /^Editar$/).emitir('click');
  assert.equal(editar.hidden, false);
  assert.equal(mudou.hidden, true);

  // Com duas descrições, a lista mostra cada uma; a mudança pode ser excluída.
  const depois = detalhe({ status: status.acompanhamento, descricao_demanda: 'OUTRA DEMANDA' });
  depois.descricoes = [d.descricoes[0], { id: 'd2', data: '2026-10-21', hora: '10:00', descricao: 'OUTRA DEMANDA', origem: 'MUDANÇA',
    unidade_nome: 'UNIDADE TESTE', profissional_nome: 'PROFISSIONAL TESTE', criado_por: 'prof1' }];
  await tela.responder(0, depois);
  assert.match(tela.conteudo.textContent, /A demanda mudou/);
  assert.match(tela.conteudo.textContent, /1º atendimento/);
  const linhas = tela.todos().filter(el => el.tagName === 'TR' && /OUTRA DEMANDA|DEMANDA TESTE/.test(el.textContent) && /Por|PROFISSIONAL/.test(el.textContent));
  assert.ok(linhas.length >= 2);

  // Transferência: pergunta se a demanda continua; só pede a nova quando mudou.
  const transf = formularioCom(tela, 'demanda_mudou');
  const pergunta = transf.elements.find(el => el.name === 'demanda_mudou');
  const nova = transf.elements.find(el => el.name === 'descricao_demanda');
  assert.equal(pergunta.required, true);
  assert.equal(nova.required, false);
  pergunta.value = 'SIM';
  pergunta.emitir('change');
  assert.equal(nova.required, true);
  tela.ctx.estado.cad.unidades.push({ id: 'u2', nome: 'UTI TESTE', setor_id: 's1', setor: 'SETOR TESTE', ativo: 'SIM' });
  const setor = transf.elements.find(el => el.name === 'setor_id');
  setor.emitir('change');
  preencher(transf, 'unidade_id', 'u2');
  preencher(transf, 'data', '2026-10-21');
  preencher(transf, 'hora', '11:00');
  nova.value = 'DEMANDA TESTE';
  transf.emitir('submit');
  const pedido = tela.pedidos.at(-1);
  assert.equal(pedido.nome, 'apiTransferirPaciente');
  assert.equal(pedido.args[0].demanda_mudou, 'SIM');
  assert.equal(pedido.args[0].descricao_demanda, 'DEMANDA TESTE');

  // Internação encerrada: só "Editar".
  tela.ctx.desenharAtendimento(detalhe({ status: status.encerrada }));
  assert.ok(botao(tela, /^Editar$/));
  assert.equal(tela.todos().some(el => el.tagName === 'BUTTON' && el.textContent === 'A demanda mudou'), false);
});

test('painel de prazos: uma linha por prazo, atrasados primeiro, alta antes de moderada e baixa, filtros na tela', async () => {
  const tela = carregar();
  tela.ctx.estado.cad.prioridades.push({ id: 'p2', tipo: 'SEGUIMENTO', nome: 'MODERADA', prazo: 3, ativo: 'SIM' },
    { id: 'p3', tipo: 'SEGUIMENTO', nome: 'BAIXA', prazo: 5, ativo: 'SIM' });
  const pendente = (prazo, situacao) => ({ estado: 'PENDENTE', prazo, situacao });
  const item = (id, nome, prazos, extra = {}) => ({ ...itemDeGestao({ id, paciente_nome: nome, ...extra }), prazos: {
    primeiro: { estado: 'CUMPRIDO' }, interconsulta: { estado: '' }, retorno: { estado: '' }, proximo: null, ...prazos } });
  const itens = [
    item('a1', 'ANA', { retorno: { ...pendente('2026-10-23', 'NO PRAZO'), prioridade: 'ALTA' } }),
    item('a2', 'BIA', { retorno: { ...pendente('2026-10-20', 'ATRASADO'), prioridade: 'BAIXA' } },
      { solicitacoes_pendentes: [{ id: 'i1', prazo: '2026-10-20', situacao: 'ATRASADO', prioridade: 'ALTA', motivo_nome: 'RISCO DE SUICÍDIO' },
        { id: 'i2', prazo: '2026-10-22', situacao: 'VENCE AMANHÃ', prioridade: 'MODERADA', motivo_nome: 'CUIDADOS PALIATIVOS' }] }),
    item('a3', 'CAIO', { primeiro: pendente('2026-10-21', 'VENCE HOJE') }, { unidade_id: 'u2', unidade_nome: 'UTI TESTE' }),
    item('a4', 'DINA', { retorno: { ...pendente('2026-10-19', 'ATRASADO'), prioridade: 'MODERADA' } })
  ];
  tela.ctx.gestaoPrazos(tela.conteudo);
  await tela.responder(0, gestao(itens));
  const linhas = () => tela.todos().filter(el => el.tagName === 'TR' && el.className && el.className.includes('clicavel'));
  const resumo = () => linhas().map(tr => tr.children.map(td => td.textContent).join(' | '));
  assert.deepEqual(resumo().map(l => l.split(' | ').slice(2).join(' | ')), [
    'InterconsultaRISCO DE SUICÍDIO | alta | 20/10/2026 | atrasado',
    'Retorno | moderada | 19/10/2026 | atrasado',
    'Retorno | baixa | 20/10/2026 | atrasado',
    '1º atendimento | — | 21/10/2026 | vence hoje',
    'InterconsultaCUIDADOS PALIATIVOS | moderada | 22/10/2026 | vence amanhã',
    'Retorno | alta | 23/10/2026 | no prazo'
  ]);
  // Cores: prioridade e situação.
  const selos = tela.todos().filter(el => el.tagName === 'SPAN' && /prioridade-/.test(el.className || ''));
  assert.ok(selos.some(s => s.className.includes('prioridade-alta') && s.textContent === 'alta'));
  assert.ok(selos.some(s => s.className.includes('prioridade-moderada')));
  assert.ok(selos.some(s => s.className.includes('prioridade-baixa')));
  assert.ok(linhas()[0].className.includes('situacao-atrasado'));
  assert.ok(linhas()[5].className.includes('situacao-prazo'));
  // Totais por situação.
  assert.match(tela.conteudo.textContent, /3Atrasados1Vencem hoje1Vencem amanhã1No prazo/);

  const form = formularioCom(tela, 'situacao');
  preencher(form, 'situacao', 'ATRASADO');
  form.emitir('change');
  assert.equal(linhas().length, 3);
  preencher(form, 'prioridade', 'ALTA');
  form.emitir('change');
  assert.equal(linhas().length, 1);
  assert.match(linhas()[0].textContent, /BIA/);
  preencher(form, 'situacao', '');
  preencher(form, 'prioridade', 'SEM');
  form.emitir('change');
  assert.equal(linhas().length, 1);
  assert.match(linhas()[0].textContent, /CAIO/);
  preencher(form, 'prioridade', '');
  preencher(form, 'unidade_id', 'u2');
  form.emitir('change');
  assert.equal(linhas().length, 1);
  assert.equal(tela.pedidos.length, 1, 'Os filtros não vão ao servidor');
  // Clicar no total filtra pela situação.
  preencher(form, 'unidade_id', '');
  form.emitir('change');
  botao(tela, /Vencem amanhã/).emitir('click');
  assert.equal(linhas().length, 1);
  assert.match(linhas()[0].textContent, /CUIDADOS PALIATIVOS/);
  linhas()[0].emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'atendimentos', arg: { id: 'a2' } });
});

test('início: os totais de atrasados, vencem hoje e vencem amanhã abrem o painel de prazos já filtrado', async () => {
  const tela = carregar();
  tela.ctx.telaInicio();
  await tela.responder(0, gestao([]));
  botao(tela, /Com prazo atrasado/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'gestao', arg: { aba: 'prazos', situacao: 'ATRASADO' } });
  botao(tela, /Vencem hoje/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'gestao', arg: { aba: 'prazos', situacao: 'VENCE HOJE' } });
  botao(tela, /Vencem amanhã/).emitir('click');
  assert.deepEqual(tela.navegacao.at(-1), { nome: 'gestao', arg: { aba: 'prazos', situacao: 'VENCE AMANHÃ' } });
});
