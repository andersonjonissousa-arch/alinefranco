/** Interconsultas pertencem à internação, mas cada solicitação tem seu próprio prazo. */
function prepararInterconsultas_() {
  // Migração aditiva e idempotente: não apaga nem reorganiza as colunas antigas.
  if (_cacheTabelas.INTERCONSULTAS) return;
  var abaAtual = abrirBanco().getSheetByName('INTERCONSULTAS');
  if (abaAtual && abaAtual.getRange(1, TABELAS.INTERCONSULTAS.length).getValues()[0][0] === 'excluido_por') {
    var idsExistentes = indicePorId_('INTERCONSULTAS');
    var faltaLegado = listar('ADMISSOES').some(function (a) {
      return a.data_solicitacao && !idsExistentes['legado_' + a.id];
    });
    if (!faltaLegado) return;
  }
  comTrava(function () {
    // Outra execução pode ter concluído a migração enquanto esta aguardava a trava.
    delete _cacheTabelas.INTERCONSULTAS;
    delete _cacheTabelas.ADMISSOES;
    var aba = abrirBanco().getSheetByName('INTERCONSULTAS');
    if (!aba || aba.getRange(1, TABELAS.INTERCONSULTAS.length).getValues()[0][0] !== 'excluido_por') {
      prepararAba(abrirBanco(), 'INTERCONSULTAS');
    }
    var existentes = indicePorId_('INTERCONSULTAS');
    listar('ADMISSOES').forEach(function (a) {
      if (!a.data_solicitacao || existentes['legado_' + a.id]) return;
      var registro = Object.assign({}, a, { id: 'legado_' + a.id, admissao_id: a.id, origem: 'LEGADO', atendimento_id: '' });
      abaDaTabela('INTERCONSULTAS').appendRow(linhaDe(TABELAS.INTERCONSULTAS, registro));
    });
    delete _cacheTabelas.INTERCONSULTAS;
    listar('INTERCONSULTAS');
  });
}

/** Resposta calculada por solicitação; somente registros antigos mantêm a associação automática. */
function listarInterconsultas_() {
  prepararInterconsultas_();
  var admissoes = mapaPorId('ADMISSOES');
  var atendimentos = listar('ATENDIMENTOS');
  var porAdmissao = agruparPor_(atendimentos, 'admissao_id');
  var porId = indicePorId_('ATENDIMENTOS');
  var feriados = conjuntoFeriados(listar('FERIADOS'));
  return listar('INTERCONSULTAS').filter(function (i) { return !i.excluido_em; }).map(function (original) {
    var adm = admissoes[original.admissao_id];
    if (!adm) return null;
    var legado = original.origem === 'LEGADO';
    var i = Object.assign({}, original);
    if (legado) ['tipo_solicitacao', 'motivo_solicitacao_id', 'data_solicitacao', 'hora_solicitacao',
      'para_quem', 'familiar_nome', 'familiar_parentesco'].forEach(function (c) { i[c] = adm[c]; });
    var resposta = porId[i.atendimento_id];
    var candidatos = legado ? (porAdmissao[adm.id] || []) :
      (resposta && resposta.admissao_id === adm.id ? [resposta] : []);
    var encerrada = adm.status === STATUS_ADMISSAO.encerrada || (legado && Boolean(adm.desfecho_id));
    var contexto = Object.assign({}, i, { data_desfecho: encerrada ? adm.data_desfecho : '' });
    var prioridade = legado ? prioridadeDe(buscarPorId('MOTIVOS_SOLICITACAO', i.motivo_solicitacao_id)) :
      (i.tem_prazo === 'SIM' ? { nome: i.prioridade_solicitacao, prazo: i.prazo_horas } : null);
    Object.assign(i, calcularResposta(contexto, candidatos, {
      prioridade: prioridade, tiposComPrazo: legado ? tiposSolicitacaoComPrazo() : (i.tem_prazo === 'SIM' ? [i.tipo_solicitacao] : []), agora: agora(), feriados: feriados
    }));
    var respondidoPor = i.momento_resposta ? candidatos.filter(function (a) {
      var vale = i.para_quem === 'FAMILIAR' ? (a.publico === 'PACIENTE' || a.publico === 'FAMÍLIA') : contaParaPrazo(a);
      return vale && dataHora(a.data, a.hora) === i.momento_resposta;
    })[0] : null;
    i.atendimento_resposta_id = respondidoPor ? respondidoPor.id : '';
    if (!legado && !i.prioridade_solicitacao) i.prioridade_solicitacao = original.prioridade_solicitacao;
    i.pendente = !i.momento_resposta && !encerrada;
    i.motivo_nome = (buscarPorId('MOTIVOS_SOLICITACAO', i.motivo_solicitacao_id) || {}).nome || '';
    // Novas solicitações independem do encerramento psicológico. O legado mantém sua regra histórica.
    i.prazo = prazosDaAdmissao(Object.assign({}, contexto, i, {
      status: encerrada ? STATUS_ADMISSAO.encerrada : STATUS_ADMISSAO.aguardando, desfecho_id: encerrada ? adm.desfecho_id : ''
    }), hoje(), agora(), feriados).interconsulta;
    if (i.momento_resposta && i.resposta_no_prazo === 'SEM PRAZO') {
      i.prazo = { estado: 'CUMPRIDO', realizado: i.momento_resposta, horas: i.horas_resposta, resultado: 'SEM PRAZO' };
    }
    return i;
  }).filter(Boolean);
}

function apiRegistrarInterconsulta(dados) {
  return responder(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    var adm = buscarPorId('ADMISSOES', dados.admissao_id);
    if (!adm) throw new Error('Admissão não encontrada.');
    if (adm.status === STATUS_ADMISSAO.encerrada) throw new Error('Esta admissão está encerrada: o paciente saiu do hospital.');
    var data = normalizarData(dados.data_solicitacao);
    var hora = normalizarHora(dados.hora_solicitacao);
    if (!data || !hora) throw new Error('Informe data e hora da solicitação.');
    if (data < normalizarData(adm.data_admissao)) throw new Error('A solicitação não pode ser antes da admissão.');
    if (dataHora(data, hora) > agora()) throw new Error('A solicitação não pode estar no futuro.');
    // Interconsulta é sempre uma solicitação da equipe, independentemente do payload da tela.
    var motivo = buscarPorId('MOTIVOS_SOLICITACAO', dados.motivo_solicitacao_id);
    if (!motivo || motivo.ativo === 'NÃO') throw new Error('Escolha o motivo da solicitação.');
    if (PARA_QUEM_SOLICITACAO.indexOf(dados.para_quem) === -1) throw new Error('Informe para quem é a solicitação.');
    var familiar = dados.para_quem === 'FAMILIAR';
    var nome = familiar ? formatarNome(dados.familiar_nome || '') : '';
    var parentesco = familiar ? formatarNome(dados.familiar_parentesco || '') : '';
    if (familiar && !nome && !parentesco) throw new Error('Informe o nome ou o parentesco do familiar.');
    var prioridade = prioridadeDe(motivo);
    var temPrazo = prioridade && prioridade.prazo !== '' && tiposSolicitacaoComPrazo().indexOf('EQUIPE') !== -1;
    prepararInterconsultas_();
    inserir('INTERCONSULTAS', {
      admissao_id: adm.id, unidade_id: unidadeNaData_(adm, data, hora), tipo_solicitacao: 'EQUIPE',
      motivo_solicitacao_id: motivo.id, data_solicitacao: data, hora_solicitacao: hora,
      para_quem: dados.para_quem, familiar_nome: nome, familiar_parentesco: parentesco,
      prioridade_solicitacao: prioridade ? prioridade.nome : '', prazo_horas: temPrazo ? prioridade.prazo : '',
      tem_prazo: temPrazo ? 'SIM' : 'NÃO', origem: 'SOLICITAÇÃO', observacoes: String(dados.observacoes || '').trim(), criado_por: usuario.id
    });
    return detalheAdmissao(adm);
  });
}

function validarRespostaInterconsulta_(id, atendimento) {
  var i = listarInterconsultas_().filter(function (s) { return s.id === id; })[0];
  if (!i || i.admissao_id !== atendimento.admissao_id) throw new Error('A interconsulta não pertence a esta admissão.');
  if (i.momento_resposta) throw new Error('Esta interconsulta já foi respondida.');
  if (dataHora(atendimento.data, atendimento.hora) < dataHora(i.data_solicitacao, i.hora_solicitacao)) {
    throw new Error('O atendimento não pode ser antes da solicitação.');
  }
  if (i.para_quem !== 'FAMILIAR' && !contaParaPrazo(atendimento)) {
    throw new Error('Este atendimento à família não responde à solicitação do paciente.');
  }
  return i;
}

function apiResponderInterconsulta(dados) {
  return responder(function () {
    usuarioAtual();
    var atendimento = buscarPorId('ATENDIMENTOS', dados.atendimento_id);
    if (!atendimento) throw new Error('Escolha o atendimento que respondeu à solicitação.');
    var i = validarRespostaInterconsulta_(dados.id, atendimento);
    atualizar('ATENDIMENTOS', atendimento.id, { tipo_atendimento: 'INTERCONSULTA' });
    atualizar('INTERCONSULTAS', i.id, { atendimento_id: atendimento.id, origem: 'SOLICITAÇÃO',
      tem_prazo: i.prazo_resposta ? 'SIM' : 'NÃO', prazo_horas: i.prazo_resposta ?
        (i.prazo_horas !== '' && i.prazo_horas !== undefined ? i.prazo_horas :
          horasUteisEntre(dataHora(i.data_solicitacao, i.hora_solicitacao), i.prazo_resposta, conjuntoFeriados(listar('FERIADOS')))) : '',
      prioridade_solicitacao: i.prioridade_solicitacao });
    return detalheAdmissao(buscarPorId('ADMISSOES', i.admissao_id));
  });
}

/** Exclui da operação, mantendo a marca para que a migração não recrie solicitações antigas. */
function apiExcluirInterconsulta(id) {
  return responder(function () {
    var usuario = usuarioAtual();
    prepararInterconsultas_();
    var i = buscarPorId('INTERCONSULTAS', id);
    if (!i || i.excluido_em) throw new Error('Interconsulta não encontrada ou já excluída.');
    exigirAutorOuCoordenacao(i, usuario);
    var adm = buscarPorId('ADMISSOES', i.admissao_id);
    if (!adm) throw new Error('Admissão não encontrada.');
    atualizar('INTERCONSULTAS', i.id, { excluido_em: agoraIso(), excluido_por: usuario.id });
    // Não apaga atendimentos, dados da admissão nem outras solicitações.
    return detalheAdmissao(adm);
  });
}
