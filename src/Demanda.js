/**
 * Descrição da demanda ao longo da internação (pedido da coordenação, opção 2):
 * - 1º atendimento: registra a descrição inicial (origem AVALIAÇÃO);
 * - "Editar" (erro de preenchimento): substitui a descrição atual, sem criar registro novo;
 * - "A demanda mudou": registra uma nova descrição com data e unidade, sem apagar a anterior (MUDANÇA);
 * - transferência: a tela pergunta se a demanda mudou; se mudou, registra ali (TRANSFERÊNCIA).
 * No compilado, cada registro conta no mês e na unidade em que foi feito.
 * Internações anteriores a esta versão, sem nenhum registro, contam a descrição da admissão (LEGADO),
 * na data do 1º atendimento.
 */

var ORIGENS_DESCRICAO = { avaliacao: 'AVALIAÇÃO', mudanca: 'MUDANÇA', transferencia: 'TRANSFERÊNCIA', legado: 'LEGADO' };

function porMomentoDaDescricao_(a, b) {
  return dataHora(a.data, a.hora || '00:00').localeCompare(dataHora(b.data, b.hora || '00:00')) ||
    String(a.criado_em || '').localeCompare(String(b.criado_em || ''));
}

/**
 * Descrições válidas da admissão, da mais antiga para a mais recente (a última é a atual).
 * registros: todos os registros desta admissão, inclusive os excluídos (para saber se é uma internação antiga).
 */
function descricoesDaAdmissao_(adm, registros) {
  var todos = registros || listar('DESCRICOES_DEMANDA').filter(function (d) { return d.admissao_id === adm.id; });
  var validos = todos.filter(function (d) { return !d.excluido_em; }).sort(porMomentoDaDescricao_);
  if (validos.length || todos.length || !adm.descricao_demanda) return validos;
  var data = normalizarData(adm.primeiro_atendimento) || normalizarData(adm.data_admissao);
  return [{ id: 'legado_' + adm.id, admissao_id: adm.id, unidade_id: unidadeNaData_(adm, data, '23:59'), data: data, hora: '',
    descricao: adm.descricao_demanda, origem: ORIGENS_DESCRICAO.legado, atendimento_id: '', transferencia_id: '',
    profissional_id: '', criado_por: '', criado_em: '', virtual: true }];
}

/** Todas as descrições de todas as internações, para o compilado. */
function listarDescricoesDemanda_() {
  var porAdmissao = agruparPor_(listar('DESCRICOES_DEMANDA'), 'admissao_id');
  var lista = [];
  listar('ADMISSOES').forEach(function (adm) {
    lista = lista.concat(descricoesDaAdmissao_(adm, porAdmissao[adm.id] || []));
  });
  return lista;
}

function validarDescricaoDemanda_(valor) {
  var descricao = String(valor || '').trim();
  if (!descricao) throw new Error('Selecione a descrição da demanda.');
  var existe = listar('LISTAS').some(function (i) { return i.lista === 'DESCRICAO_DEMANDA' && i.valor === descricao; });
  if (!existe) throw new Error('Descrição da demanda não encontrada na lista.');
  return descricao;
}

/** Grava a descrição da internação antiga como registro, para que a mudança não a apague. */
function materializarDescricaoLegada_(adm, descricoes) {
  if (descricoes.length !== 1 || !descricoes[0].virtual) return descricoes;
  var d = Object.assign({}, descricoes[0]);
  delete d.id;
  delete d.virtual;
  return [inserir('DESCRICOES_DEMANDA', d)];
}

/** A admissão guarda a descrição atual (a do registro mais recente). */
function sincronizarDescricaoAtual_(admissaoId) {
  var adm = buscarPorId('ADMISSOES', admissaoId);
  var descricoes = descricoesDaAdmissao_(adm);
  var atual = descricoes[descricoes.length - 1];
  if (atual && atual.descricao !== adm.descricao_demanda) atualizar('ADMISSOES', adm.id, { descricao_demanda: atual.descricao });
}

/** 1º atendimento: registra a descrição inicial, na data, hora e unidade do atendimento. */
function registrarDescricaoDaAvaliacao_(adm, atendimento, descricao, usuario) {
  var temAvaliacao = descricoesDaAdmissao_(adm).some(function (d) { return d.origem === ORIGENS_DESCRICAO.avaliacao; });
  if (temAvaliacao || !descricao) return;
  inserir('DESCRICOES_DEMANDA', {
    admissao_id: adm.id, unidade_id: atendimento.unidade_id, data: atendimento.data, hora: atendimento.hora, descricao: descricao,
    origem: ORIGENS_DESCRICAO.avaliacao, atendimento_id: atendimento.id, profissional_id: atendimento.profissional_id, criado_por: usuario.id
  });
  sincronizarDescricaoAtual_(adm.id);
}

/**
 * O atendimento com a descrição inicial foi excluído. Se a internação tem outros atendimentos, a descrição
 * passa para o novo 1º atendimento (data, hora e unidade dele); se não tem, deixa de contar.
 */
function excluirDescricaoDoAtendimento_(atendimento, usuario) {
  var registros = listar('DESCRICOES_DEMANDA').filter(function (d) { return d.atendimento_id === atendimento.id && !d.excluido_em; });
  if (!registros.length) return;
  var novoPrimeiro = listar('ATENDIMENTOS').filter(function (a) { return a.admissao_id === atendimento.admissao_id && a.id !== atendimento.id; })
    .sort(function (a, b) { return dataHora(a.data, a.hora).localeCompare(dataHora(b.data, b.hora)); })[0];
  registros.forEach(function (d) {
    atualizar('DESCRICOES_DEMANDA', d.id, novoPrimeiro
      ? { data: novoPrimeiro.data, hora: novoPrimeiro.hora, unidade_id: novoPrimeiro.unidade_id, atendimento_id: novoPrimeiro.id,
        profissional_id: novoPrimeiro.profissional_id }
      : { excluido_em: agoraIso(), excluido_por: usuario.id });
  });
  sincronizarDescricaoAtual_(atendimento.admissao_id);
}

/** Nova descrição porque a demanda mudou (na tela da internação ou na transferência). */
function registrarMudancaDeDemanda_(adm, campos, usuario) {
  if (adm.status === STATUS_ADMISSAO.aguardando) throw new Error('A descrição da demanda é informada no 1º atendimento.');
  var descricao = validarDescricaoDemanda_(campos.descricao);
  var descricoes = materializarDescricaoLegada_(adm, descricoesDaAdmissao_(adm));
  var atual = descricoes[descricoes.length - 1];
  if (atual && atual.descricao === descricao) throw new Error('Esta já é a descrição atual. Escolha a nova demanda.');
  if (atual && dataHora(campos.data, campos.hora) < dataHora(atual.data, atual.hora || '00:00')) {
    throw new Error('A mudança não pode ser antes da descrição atual (' + atual.data.split('-').reverse().join('/') + ').');
  }
  var registro = inserir('DESCRICOES_DEMANDA', {
    admissao_id: adm.id, unidade_id: campos.unidade_id || unidadeNaData_(adm, campos.data, campos.hora),
    data: campos.data, hora: campos.hora, descricao: descricao, origem: campos.origem,
    transferencia_id: campos.transferencia_id || '', profissional_id: usuario.id, criado_por: usuario.id
  });
  sincronizarDescricaoAtual_(adm.id);
  return registro;
}

/** "Editar": corrige a descrição atual (erro de preenchimento). Não cria registro novo nem muda data e unidade. */
function apiSalvarDescricaoDemanda(dados) {
  return responderGravando(function () {
    usuarioAtual();
    dados = dados || {};
    var adm = buscarPorId('ADMISSOES', dados.id);
    if (!adm) throw new Error('Admissão não encontrada.');
    var descricao = validarDescricaoDemanda_(dados.descricao_demanda);
    var descricoes = descricoesDaAdmissao_(adm);
    var atual = descricoes[descricoes.length - 1];
    if (!atual) {
      // Sem 1º atendimento ainda: só guarda na admissão; o registro nasce no 1º atendimento.
      atualizar('ADMISSOES', adm.id, { descricao_demanda: descricao });
    } else if (atual.virtual) {
      materializarDescricaoLegada_(adm, [Object.assign({}, atual, { descricao: descricao })]);
      sincronizarDescricaoAtual_(adm.id);
    } else if (atual.descricao !== descricao) {
      atualizar('DESCRICOES_DEMANDA', atual.id, { descricao: descricao });
      sincronizarDescricaoAtual_(adm.id);
    }
    return detalheAdmissao(buscarPorId('ADMISSOES', adm.id));
  });
}

/** "A demanda mudou": registra a nova descrição com data, hora e a unidade daquele momento. */
function apiMudarDescricaoDemanda(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    var adm = buscarPorId('ADMISSOES', dados.id);
    if (!adm) throw new Error('Admissão não encontrada.');
    if (adm.status === STATUS_ADMISSAO.encerrada) throw new Error('Esta internação está encerrada: use "Editar" para corrigir a descrição.');
    var data = normalizarData(dados.data) || hoje();
    var hora = normalizarHora(dados.hora) || agora().slice(11, 16);
    if (data < normalizarData(adm.data_admissao)) throw new Error('A mudança não pode ser antes da admissão.');
    if (dataHora(data, hora) > agora()) throw new Error('A mudança não pode estar no futuro.');
    registrarMudancaDeDemanda_(adm, { descricao: dados.descricao_demanda, data: data, hora: hora, origem: ORIGENS_DESCRICAO.mudanca }, usuario);
    return detalheAdmissao(buscarPorId('ADMISSOES', adm.id));
  });
}

/** Exclui uma mudança registrada por engano. A descrição do 1º atendimento sai junto com o atendimento. */
function apiExcluirDescricaoDemanda(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var d = buscarPorId('DESCRICOES_DEMANDA', id);
    if (!d || d.excluido_em) throw new Error('Registro da descrição não encontrado.');
    if (d.origem !== ORIGENS_DESCRICAO.mudanca && d.origem !== ORIGENS_DESCRICAO.transferencia) {
      throw new Error('Só uma mudança de demanda pode ser excluída. Para corrigir a descrição, use "Editar".');
    }
    exigirAutorOuCoordenacao(d, usuario);
    atualizar('DESCRICOES_DEMANDA', d.id, { excluido_em: agoraIso(), excluido_por: usuario.id });
    sincronizarDescricaoAtual_(d.admissao_id);
    return detalheAdmissao(buscarPorId('ADMISSOES', d.admissao_id));
  });
}
