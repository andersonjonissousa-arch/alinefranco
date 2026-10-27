/**
 * Histórico completo do paciente: todas as internações, da mais recente para a mais antiga, cada uma com
 * a linha do tempo de solicitações, atendimentos, mudanças de justificativa, transferências e desfechos.
 * Só consulta: nada é gravado.
 */
function apiHistoricoPaciente(pacienteId) {
  return responder(function () {
    usuarioAtual();
    var paciente = buscarPorId('PACIENTES', pacienteId);
    if (!paciente) throw new Error('Paciente não encontrado.');
    var aux = auxiliares();
    var internacoes = listar('ADMISSOES').filter(function (a) { return a.paciente_id === paciente.id; })
      .sort(function (a, b) {
        return String(b.data_admissao).localeCompare(String(a.data_admissao)) || String(b.criado_em).localeCompare(String(a.criado_em));
      })
      .map(function (adm) {
        var det = detalheAdmissao(adm, aux, true);
        return { admissao: det.admissao, eventos: eventosDaInternacao_(det) };
      });
    var contar = function (tipo) {
      return internacoes.reduce(function (n, i) { return n + i.eventos.filter(function (e) { return e.tipo === tipo; }).length; }, 0);
    };
    return {
      paciente: paciente,
      internacoes: internacoes,
      resumo: { internacoes: internacoes.length, atendimentos: contar('ATENDIMENTO'), solicitacoes: contar('SOLICITAÇÃO'),
        desfechos: contar('DESFECHO') }
    };
  });
}

// Ordem dentro do mesmo dia e hora; a lista sai do mais recente para o mais antigo.
var ORDEM_EVENTO_HISTORICO = { 'ENTRADA': 0, 'TRANSFERÊNCIA': 1, 'SOLICITAÇÃO': 2, 'ATENDIMENTO': 3, 'DEMANDA': 4, 'JUSTIFICATIVA': 5,
  'ATIVIDADE': 6, 'DESFECHO': 7, 'RETOMADA': 8 };

/** Linha do tempo de uma internação, a partir do detalhe da admissão (detalheAdmissao). */
function eventosDaInternacao_(det) {
  var adm = det.admissao;
  var eventos = [];
  var incluir = function (tipo, data, hora, campos) {
    if (!data) return;
    eventos.push(Object.assign({ tipo: tipo, data: data, hora: hora || '' }, campos));
  };

  incluir('ENTRADA', adm.data_admissao, '', { unidade_nome: adm.unidade_admissao_nome || adm.unidade_nome, admissao_id: adm.id });

  (det.transferencias || []).forEach(function (t) {
    incluir('TRANSFERÊNCIA', t.data, t.hora, { origem_nome: t.origem_nome, destino_nome: t.destino_nome, profissional_nome: t.profissional_nome });
  });

  (det.interconsultas || []).forEach(function (i) {
    incluir('SOLICITAÇÃO', i.data_solicitacao, i.hora_solicitacao, {
      solicitacao_id: i.id, tipo_solicitacao: i.tipo_solicitacao, motivo_nome: i.motivo_nome,
      prioridade: i.prioridade_solicitacao, para_quem: i.para_quem, familiar_nome: i.familiar_nome,
      familiar_parentesco: i.familiar_parentesco, prazo: i.prazo_resposta, resultado: i.resposta_no_prazo,
      respondida_em: i.momento_resposta, dias_resposta: i.dias_resposta, pendente: Boolean(i.pendente), observacoes: i.observacoes || ''
    });
  });

  // Atendimentos em ordem cronológica, para achar quando a justificativa mudou.
  var anterior = null;
  (det.atendimentos || []).slice().sort(function (a, b) {
    return String(a.data + ' ' + a.hora).localeCompare(String(b.data + ' ' + b.hora)) || String(a.criado_em).localeCompare(String(b.criado_em));
  }).forEach(function (at) {
    var prazo = at.prazo_acompanhamento || {};
    incluir('ATENDIMENTO', at.data, at.hora, {
      atendimento_id: at.id, profissional_nome: at.profissional_nome, categoria: at.categoria, publico: at.publico,
      quantidade: at.quantidade, tipo_atendimento: at.tipo_atendimento, justificativa_nome: at.justificativa_nome,
      unidade_nome: at.unidade_nome, observacao: at.observacao || '',
      tipo_prazo: prazo.tipo || '', prazo: prazo.prazo || '', resultado: prazo.resultado || '',
      interconsultas_respondidas: (at.interconsultas_respondidas || []).map(function (i) { return i.id; })
    });
    if (at.justificativa_id && (!anterior || anterior.justificativa_id !== at.justificativa_id)) {
      incluir('JUSTIFICATIVA', at.data, at.hora, {
        de: anterior ? anterior.justificativa_nome : '', para: at.justificativa_nome, profissional_nome: at.profissional_nome
      });
    }
    if (at.justificativa_id) anterior = at;
  });

  // Descrição da demanda: a do 1º atendimento e cada mudança (na tela da internação ou na transferência).
  var demandaAnterior = '';
  (det.descricoes || []).forEach(function (d) {
    incluir('DEMANDA', d.data, d.hora, { origem: d.origem, descricao: d.descricao, de: demandaAnterior,
      unidade_nome: d.unidade_nome, profissional_nome: d.profissional_nome });
    demandaAnterior = d.descricao;
  });

  (det.atividades || []).forEach(function (a) {
    incluir('ATIVIDADE', a.data, '', { atividade: a.tipo, quantidade: a.quantidade, profissional_nome: a.profissional_nome,
      unidade_nome: a.unidade_nome });
  });

  (det.desfechos || []).forEach(function (d) {
    incluir('DESFECHO', d.data, '', { desfecho_nome: d.desfecho_nome, encerra_admissao: d.encerra_admissao,
      vigente: d.vigente, unidade_nome: d.unidade_nome });
  });

  // Cada retomada deixa uma nota nas observações da admissão; a última também fica em retomado_em.
  var notas = String(adm.observacoes || '').match(/Acompanhamento retomado em \d{2}\/\d{2}\/\d{4} por [^\n(]+\(desfecho anterior: [^\n]*?\)\./g) || [];
  notas.forEach(function (nota) {
    var m = /em (\d{2})\/(\d{2})\/(\d{4}) por ([^(]+?) \(desfecho anterior: (.*?) em/.exec(nota);
    if (m) incluir('RETOMADA', m[3] + '-' + m[2] + '-' + m[1], '', { profissional_nome: m[4], desfecho_anterior: m[5] });
  });
  if (!notas.length && adm.retomado_em) incluir('RETOMADA', normalizarData(adm.retomado_em), '', { profissional_nome: '', desfecho_anterior: '' });

  // Sem hora: a entrada vale do início do dia; desfecho e retomada, do fim.
  var chave = function (e) {
    var hora = e.hora || (e.tipo === 'ENTRADA' ? '00:00' : e.tipo === 'DESFECHO' || e.tipo === 'RETOMADA' ? '23:59' : '12:00');
    return e.data + ' ' + hora;
  };
  return eventos.sort(function (a, b) {
    return chave(b).localeCompare(chave(a)) || ORDEM_EVENTO_HISTORICO[b.tipo] - ORDEM_EVENTO_HISTORICO[a.tipo];
  });
}
