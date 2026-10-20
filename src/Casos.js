/**
 * Casos (da solicitação ao desfecho), atendimentos e atividades assistenciais.
 */

var CAMPOS_CASO_EDITAVEIS = [
  'paciente_id', 'unidade_id', 'data_admissao', 'tipo_solicitacao', 'descricao_solicitacao',
  'prioridade_solicitacao', 'data_solicitacao', 'atendido', 'descricao_demanda', 'prioridade_demanda',
  'data_avaliacao', 'avaliado_por', 'necessidade_acompanhamento', 'justificativa_id', 'data_encerramento',
  'desfecho', 'observacoes'
];
var CAMPOS_DATA_CASO = ['data_admissao', 'data_solicitacao', 'data_avaliacao', 'data_encerramento'];
var ROTULOS_DATA_CASO = {
  data_admissao: 'admissão', data_solicitacao: 'solicitação', data_avaliacao: 'avaliação', data_encerramento: 'encerramento'
};

function mapaPorId(nome) {
  var mapa = {};
  listar(nome).forEach(function (x) { mapa[x.id] = x; });
  return mapa;
}

function prazosPorJustificativa() {
  var prazos = {};
  listar('JUSTIFICATIVAS').forEach(function (j) { prazos[j.id] = j.prazo_dias_uteis; });
  return prazos;
}

/** Recalcula tempos, status e prazos do caso e de seus atendimentos, e grava o que mudou. */
function recalcularCaso(casoId) {
  recalcularCasos([casoId]);
  return buscarPorId('CASOS', casoId);
}

function recalcularCasos(ids) {
  var prazos = prazosPorJustificativa();
  var feriados = conjuntoFeriados(listar('FERIADOS'));
  var atendimentos = listar('ATENDIMENTOS');
  var mudancasCasos = {};
  var mudancasAtend = {};
  ids.forEach(function (id) {
    var caso = buscarPorId('CASOS', id);
    if (!caso) return;
    var campos = calcularCampos(caso);
    var doCaso = atendimentos.filter(function (a) { return a.caso_id === id; });
    var prazosCaso = calcularPrazos(Object.assign({}, caso, campos), doCaso, prazos, feriados);
    campos.ultimo_contato = prazosCaso.ultimo_contato;
    campos.proximo_prazo = prazosCaso.proximo_prazo;
    if (Object.keys(campos).some(function (c) { return String(caso[c]) !== String(campos[c]); })) mudancasCasos[id] = campos;
    doCaso.forEach(function (a) {
      var novo = prazosCaso.porAtendimento[a.id];
      if (novo && (a.prazo_limite !== novo.prazo_limite || a.no_prazo !== novo.no_prazo)) mudancasAtend[a.id] = novo;
    });
  });
  atualizarVarios('CASOS', mudancasCasos);
  atualizarVarios('ATENDIMENTOS', mudancasAtend);
}

/** Usado quando muda um prazo de justificativa ou um feriado. */
function recalcularCasosAbertos() {
  recalcularCasos(listar('CASOS').filter(function (c) { return c.status !== 'ENCERRADO'; }).map(function (c) { return c.id; }));
}

/** Caso com os nomes que a tela mostra (paciente, unidade, justificativa) e a situação do prazo. */
function resumoCaso(caso, aux) {
  var paciente = aux.pacientes[caso.paciente_id] || {};
  var unidade = aux.unidades[caso.unidade_id] || {};
  var justificativa = aux.justificativas[caso.justificativa_id] || {};
  return Object.assign({}, caso, {
    paciente_nome: paciente.nome || '',
    prontuario: paciente.prontuario || '',
    unidade_nome: unidade.nome || '',
    setor_id: unidade.setor_id || '',
    justificativa_nome: justificativa.nome || '',
    prazo_dias_uteis: justificativa.prazo_dias_uteis === undefined ? '' : justificativa.prazo_dias_uteis,
    situacao: caso.status === 'ENCERRADO' ? '' : situacaoPrazo(caso.proximo_prazo, aux.hoje)
  });
}

function auxiliares() {
  return {
    pacientes: mapaPorId('PACIENTES'),
    unidades: mapaPorId('UNIDADES'),
    justificativas: mapaPorId('JUSTIFICATIVAS'),
    profissionais: mapaPorId('PROFISSIONAIS'),
    hoje: hoje()
  };
}

var ORDEM_SITUACAO = { 'ATRASADO': 0, 'VENCE HOJE': 1, 'NO PRAZO': 2, '': 3 };

/** Casos filtrados por status ('ABERTO', 'ENCERRADO' ou vazio), unidade, setor e texto (nome ou prontuário). */
function apiListarCasos(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var aux = auxiliares();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var lista = listar('CASOS').map(function (c) { return resumoCaso(c, aux); }).filter(function (c) {
      if (f.status && c.status !== f.status) return false;
      if (f.unidade_id && c.unidade_id !== f.unidade_id) return false;
      if (f.setor_id && c.setor_id !== f.setor_id) return false;
      if (f.situacao && c.situacao !== f.situacao) return false;
      if (termo && normalizarTexto(c.paciente_nome).indexOf(termo) === -1 &&
        !(prontuario && normalizarProntuario(c.prontuario) === prontuario)) return false;
      return true;
    });
    lista.sort(function (a, b) {
      var s = ORDEM_SITUACAO[a.situacao] - ORDEM_SITUACAO[b.situacao];
      if (s) return s;
      var pa = a.proximo_prazo || '9999';
      var pb = b.proximo_prazo || '9999';
      if (pa !== pb) return pa < pb ? -1 : 1;
      return String(b.data_solicitacao).localeCompare(String(a.data_solicitacao));
    });
    return lista.slice(0, Number(f.limite) || 300);
  });
}

/** Caso completo para a tela de detalhe: dados, atendimentos e atividades. */
function apiObterCaso(id) {
  return responder(function () {
    usuarioAtual();
    var caso = buscarPorId('CASOS', id);
    if (!caso) throw new Error('Caso não encontrado.');
    return detalheCaso(caso);
  });
}

function detalheCaso(caso) {
  var aux = auxiliares();
  var nomeProf = function (pid) { return (aux.profissionais[pid] || {}).nome || ''; };
  var porData = function (a, b) {
    return String(b.data).localeCompare(String(a.data)) || String(b.criado_em).localeCompare(String(a.criado_em));
  };
  var atendimentos = listar('ATENDIMENTOS').filter(function (a) { return a.caso_id === caso.id; }).sort(porData)
    .map(function (a) { return Object.assign({ profissional_nome: nomeProf(a.profissional_id) }, a); });
  var atividades = listar('ATIVIDADES').filter(function (a) { return a.caso_id === caso.id; }).sort(porData)
    .map(function (a) { return Object.assign({ profissional_nome: nomeProf(a.profissional_id) }, a); });
  return {
    caso: resumoCaso(caso, aux),
    paciente: aux.pacientes[caso.paciente_id] || null,
    avaliado_por_nome: nomeProf(caso.avaliado_por),
    atendimentos: atendimentos,
    atividades: atividades
  };
}

function apiSalvarCaso(dados) {
  return responder(function () {
    var usuario = usuarioAtual();
    var caso = {};
    CAMPOS_CASO_EDITAVEIS.forEach(function (c) {
      var v = dados[c] === undefined || dados[c] === null ? '' : String(dados[c]).trim();
      caso[c] = CAMPOS_DATA_CASO.indexOf(c) !== -1 ? normalizarData(v) : v;
    });
    caso.observacoes = String(dados.observacoes || '').trim();
    if (caso.data_avaliacao && !caso.avaliado_por) caso.avaliado_por = usuario.id;

    var erros = validarCaso(caso);
    if (!buscarPorId('PACIENTES', caso.paciente_id)) erros.unshift('Paciente não encontrado.');
    if (caso.unidade_id && !buscarPorId('UNIDADES', caso.unidade_id)) erros.push('Unidade não encontrada.');
    var hojeIso = hoje();
    CAMPOS_DATA_CASO.forEach(function (c) {
      if (caso[c] && caso[c] > hojeIso) erros.push('A data de ' + ROTULOS_DATA_CASO[c] + ' está no futuro.');
    });
    var precisaJustificativa = caso.data_avaliacao && caso.necessidade_acompanhamento &&
      SEM_ACOMPANHAMENTO.indexOf(caso.necessidade_acompanhamento) === -1;
    if (precisaJustificativa && !caso.justificativa_id) erros.push('Informe a justificativa do acompanhamento.');
    var outroAberto = listar('CASOS').filter(function (c) {
      return c.paciente_id === caso.paciente_id && c.status !== 'ENCERRADO' && c.id !== dados.id;
    })[0];
    if (outroAberto && !caso.desfecho) erros.push('Este paciente já tem um caso aberto. Abra esse caso ou registre o desfecho dele antes.');
    if (erros.length) throw new Error(erros.join(' '));

    var salvo = dados.id
      ? atualizar('CASOS', dados.id, caso)
      : inserir('CASOS', Object.assign({ criado_por: usuario.id, status: 'ABERTO' }, caso));
    return detalheCaso(recalcularCaso(salvo.id));
  });
}

/** Profissional informado na tela ou, se não vier, quem está logado. */
function profissionalDoRegistro(id, usuario) {
  if (!id || id === usuario.id) return usuario;
  var prof = buscarPorId('PROFISSIONAIS', id);
  if (!prof || prof.ativo !== 'SIM') throw new Error('Profissional não encontrado.');
  return prof;
}

function validarDataRegistro(data, caso) {
  if (!data) throw new Error('Informe a data.');
  if (data > hoje()) throw new Error('A data não pode estar no futuro.');
  if (caso.data_solicitacao && data < normalizarData(caso.data_solicitacao)) throw new Error('A data não pode ser antes da solicitação.');
  if (caso.data_encerramento && data > normalizarData(caso.data_encerramento)) throw new Error('A data não pode ser depois do encerramento do caso.');
}

function apiRegistrarAtendimento(dados) {
  return responder(function () {
    var usuario = usuarioAtual();
    var caso = buscarPorId('CASOS', dados.caso_id);
    if (!caso) throw new Error('Caso não encontrado.');
    var data = normalizarData(dados.data);
    validarDataRegistro(data, caso);
    if (PUBLICOS_ATENDIMENTO.indexOf(dados.publico) === -1) throw new Error('Escolha se o atendimento foi ao paciente ou à família.');
    var quantidade = Number(dados.quantidade || 1);
    if (!(quantidade >= 1 && quantidade <= 20 && Math.floor(quantidade) === quantidade)) throw new Error('Quantidade inválida.');
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    inserir('ATENDIMENTOS', {
      caso_id: caso.id,
      data: data,
      publico: dados.publico,
      quantidade: quantidade,
      profissional_id: prof.id,
      categoria: prof.categoria,
      justificativa_id: caso.justificativa_id,
      observacao: String(dados.observacao || '').trim(),
      criado_por: usuario.id
    });
    return detalheCaso(recalcularCaso(caso.id));
  });
}

/** Quem registrou ou a coordenação pode excluir um lançamento. */
function exigirAutorOuCoordenacao(registro, usuario) {
  if (usuario.perfil === 'COORDENAÇÃO') return;
  if (registro.criado_por === usuario.id || registro.profissional_id === usuario.id) return;
  throw new Error('Só quem registrou ou a coordenação pode excluir.');
}

function apiExcluirAtendimento(id) {
  return responder(function () {
    var usuario = usuarioAtual();
    var atendimento = buscarPorId('ATENDIMENTOS', id);
    if (!atendimento) throw new Error('Atendimento não encontrado.');
    exigirAutorOuCoordenacao(atendimento, usuario);
    excluir('ATENDIMENTOS', id);
    return detalheCaso(recalcularCaso(atendimento.caso_id));
  });
}

function apiRegistrarAtividade(dados) {
  return responder(function () {
    var usuario = usuarioAtual();
    var caso = buscarPorId('CASOS', dados.caso_id);
    if (!caso) throw new Error('Caso não encontrado.');
    var data = normalizarData(dados.data);
    validarDataRegistro(data, caso);
    var tipos = listar('LISTAS').filter(function (i) { return i.lista === 'ATIVIDADE_ASSISTENCIAL'; }).map(function (i) { return i.valor; });
    if (tipos.indexOf(dados.tipo) === -1) throw new Error('Escolha a atividade.');
    var quantidade = Number(dados.quantidade || 1);
    if (!(quantidade >= 1 && quantidade <= 20 && Math.floor(quantidade) === quantidade)) throw new Error('Quantidade inválida.');
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    inserir('ATIVIDADES', {
      caso_id: caso.id, data: data, tipo: dados.tipo, quantidade: quantidade,
      profissional_id: prof.id, categoria: prof.categoria
    });
    return detalheCaso(caso);
  });
}

function apiExcluirAtividade(id) {
  return responder(function () {
    var usuario = usuarioAtual();
    var atividade = buscarPorId('ATIVIDADES', id);
    if (!atividade) throw new Error('Atividade não encontrada.');
    exigirAutorOuCoordenacao(atividade, usuario);
    excluir('ATIVIDADES', id);
    return detalheCaso(buscarPorId('CASOS', atividade.caso_id));
  });
}
