/**
 * Telas de gestão: pacientes ativos por setor e unidade, interconsultas e os três prazos de cada admissão.
 */

/** Admissão resumida com os três prazos e os dias de internação. */
function itemDeGestao(adm, aux) {
  var r = resumoAdmissao(adm, aux);
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var prioridade = justificativa.prioridade_id ? (aux.prioridades[justificativa.prioridade_id] || {}) : {};
  return Object.assign(r, {
    prazos: prazosDaAdmissao(adm, aux.hoje, aux.agora),
    dias_internado: diasEntre(adm.data_admissao, aux.hoje),
    periodicidade: prioridade.periodicidade || ''
  });
}

function auxiliaresGestao() {
  return Object.assign(auxiliares(), { prioridades: mapaPorId('PRIORIDADES') });
}

function ordemUrgencia(a, b) {
  var pa = a.prazos.proximo;
  var pb = b.prazos.proximo;
  var g = (pb ? GRAVIDADE_SITUACAO[pb.situacao] : -1) - (pa ? GRAVIDADE_SITUACAO[pa.situacao] : -1);
  if (g) return g;
  var xa = pa ? pa.prazo : '9999';
  var xb = pb ? pb.prazo : '9999';
  if (xa !== xb) return xa < xb ? -1 : 1;
  return String(a.paciente_nome).localeCompare(String(b.paciente_nome));
}

/**
 * Pacientes internados acompanhados pela psicologia (admissões não encerradas).
 * filtros: { setor_id, unidade_id, termo, incluir_encerrados: 'SIM' para incluir quem teve desfecho
 *            psicológico e segue internado, pendencia: 'ATRASADOS' | 'PENDENTES' | '' }
 */
function apiGestao(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var aux = auxiliaresGestao();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var itens = listar('ADMISSOES').filter(function (a) {
      if (a.status === STATUS_ADMISSAO.encerrada) return false;
      if (a.status === STATUS_ADMISSAO.acompanhamentoEncerrado && f.incluir_encerrados !== 'SIM') return false;
      return true;
    }).map(function (a) { return itemDeGestao(a, aux); }).filter(function (a) {
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.pendencia === 'ATRASADOS' && !(a.prazos.proximo && a.prazos.proximo.situacao === 'ATRASADO')) return false;
      if (f.pendencia === 'PENDENTES' && !a.prazos.proximo) return false;
      if (termo && normalizarTexto(a.paciente_nome).indexOf(termo) === -1 &&
        !(prontuario && normalizarProntuario(a.prontuario) === prontuario)) return false;
      return true;
    });
    itens.sort(ordemUrgencia);

    var resumo = { pacientes: itens.length, aguardando_primeiro: 0, interconsultas_pendentes: 0, atrasados: 0, vencem_hoje: 0 };
    itens.forEach(function (a) {
      if (a.prazos.primeiro.estado === 'PENDENTE') resumo.aguardando_primeiro++;
      if (a.prazos.interconsulta.estado === 'PENDENTE') resumo.interconsultas_pendentes++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'ATRASADO') resumo.atrasados++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'VENCE HOJE') resumo.vencem_hoje++;
    });
    return { itens: itens, resumo: resumo, hoje: aux.hoje, agora: aux.agora };
  });
}

/**
 * Interconsultas (solicitações com prazo de resposta).
 * filtros: { situacao: 'PENDENTES' | 'RESPONDIDAS' | 'TODAS', dias (período das respondidas, padrão 30),
 *            setor_id, unidade_id, prioridade }
 */
function apiInterconsultas(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var aux = auxiliaresGestao();
    var dias = Number(f.dias) || 30;
    var desde = adicionarDias(aux.hoje, -dias);
    var itens = listar('ADMISSOES').filter(function (a) {
      return a.resposta_no_prazo && a.resposta_no_prazo !== 'SEM PRAZO';
    }).map(function (a) { return itemDeGestao(a, aux); }).filter(function (a) {
      var pendente = a.prazos.interconsulta.estado === 'PENDENTE';
      if (f.situacao === 'PENDENTES' && !pendente) return false;
      if (f.situacao === 'RESPONDIDAS' && pendente) return false;
      if (!pendente && normalizarData(a.data_solicitacao) < desde) return false;
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.prioridade && a.prioridade_solicitacao !== f.prioridade) return false;
      return true;
    });
    itens.sort(function (a, b) {
      var pa = a.prazos.interconsulta.estado === 'PENDENTE' ? 0 : 1;
      var pb = b.prazos.interconsulta.estado === 'PENDENTE' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (!pa) return a.prazo_resposta < b.prazo_resposta ? -1 : 1;
      return String(b.data_solicitacao + b.hora_solicitacao).localeCompare(String(a.data_solicitacao + a.hora_solicitacao));
    });
    var resumo = { pendentes: 0, atrasadas: 0, respondidas: 0, no_prazo: 0 };
    itens.forEach(function (a) {
      var i = a.prazos.interconsulta;
      if (i.estado === 'PENDENTE') { resumo.pendentes++; if (i.situacao === 'ATRASADO') resumo.atrasadas++; }
      if (i.estado === 'CUMPRIDO') { resumo.respondidas++; if (i.resultado === 'NO PRAZO') resumo.no_prazo++; }
    });
    return { itens: itens, resumo: resumo, dias: dias, agora: aux.agora };
  });
}
