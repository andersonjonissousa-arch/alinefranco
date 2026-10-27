/**
 * Telas de gestão: pacientes ativos por setor e unidade, interconsultas e os três prazos de cada admissão.
 */

/** Admissão resumida com os três prazos e os dias de internação. */
function itemDeGestao(adm, aux) {
  var r = resumoAdmissao(adm, aux);
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var prioridade = justificativa.prioridade_id ? (aux.prioridades[justificativa.prioridade_id] || {}) : {};
  var prazos = prazosDaAdmissao(r, aux.hoje, aux.agora, aux.feriados);
  var pendentes = (aux.interconsultasPorAdmissao[adm.id] || []).filter(function (i) { return i.pendente && i.prazo_resposta; })
    .sort(function (a, b) { return a.prazo_resposta.localeCompare(b.prazo_resposta); });
  if (pendentes.length) {
    prazos.interconsulta = pendentes[0].prazo;
    var p = prazos.interconsulta;
    if (!prazos.proximo || p.prazo < prazos.proximo.prazo + (prazos.proximo.prazo.length === 10 ? ' 23:59' : '')) {
      prazos.proximo = { tipo: 'INTERCONSULTA', prazo: p.prazo, situacao: p.situacao };
    }
  }
  return Object.assign(r, {
    // Painel de prazos: cada interconsulta pendente com prazo vira uma linha própria.
    solicitacoes_pendentes: pendentes.map(function (i) {
      return { id: i.id, prazo: i.prazo_resposta, situacao: i.prazo.situacao, prioridade: i.prioridade_solicitacao || '',
        motivo_nome: i.motivo_nome, dias_restantes: i.prazo.dias_restantes };
    }),
    unidade_id: r.unidade_atual_id,
    unidade_nome: r.unidade_atual_nome,
    setor_id: r.setor_atual_id,
    prazos: prazos,
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
    return dadosDeGestao_(filtros);
  });
}

/** Compartilhado com a abertura inicial; acesso validado pela API chamadora. */
function dadosDeGestao_(filtros) {
    var f = filtros || {};
    if (f.status_atendimento && ['ATIVOS', 'INATIVOS', 'TODOS'].indexOf(f.status_atendimento) === -1) throw new Error('Filtro de situação inválido.');
    var aux = auxiliaresGestao();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var itens = listar('ADMISSOES').filter(function (a) {
      if (f.status_atendimento) {
        var inativa = Boolean(a.desfecho_id) || a.status === STATUS_ADMISSAO.encerrada || a.status === STATUS_ADMISSAO.acompanhamentoEncerrado;
        return f.status_atendimento === 'TODOS' || (f.status_atendimento === 'INATIVOS' ? inativa : !inativa);
      }
      if (a.status === STATUS_ADMISSAO.encerrada) return false;
      if (a.status === STATUS_ADMISSAO.acompanhamentoEncerrado && f.incluir_encerrados !== 'SIM' &&
        !(aux.interconsultasPorAdmissao[a.id] || []).some(function (i) { return i.pendente; })) return false;
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

    var resumo = { pacientes: itens.length, aguardando_primeiro: 0, interconsultas_pendentes: 0, atrasados: 0, vencem_hoje: 0, vencem_amanha: 0 };
    itens.forEach(function (a) {
      if (a.prazos.primeiro.estado === 'PENDENTE') resumo.aguardando_primeiro++;
      resumo.interconsultas_pendentes += a.interconsultas_pendentes || 0;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'ATRASADO') resumo.atrasados++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'VENCE HOJE') resumo.vencem_hoje++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'VENCE AMANHÃ') resumo.vencem_amanha++;
    });
    return { itens: itens, resumo: resumo, hoje: aux.hoje, agora: aux.agora };
}

/**
 * Interconsultas: uma linha por solicitação, inclusive quando não há prazo configurado.
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
    var itens = aux.interconsultas.map(function (i) {
      var adm = buscarPorId('ADMISSOES', i.admissao_id);
      var unidade = aux.unidades[i.unidade_id] || {};
      return Object.assign({}, resumoAdmissao(adm, aux), i, { id: adm.id, interconsulta_id: i.id,
        unidade_nome: unidade.nome || '', setor_id: unidade.setor_id || '', prazos: { interconsulta: i.prazo } });
    }).filter(function (a) {
      var pendente = a.pendente;
      if (f.situacao === 'PENDENTES' && !pendente) return false;
      if (f.situacao === 'RESPONDIDAS' && !a.momento_resposta) return false;
      if (!pendente && normalizarData(a.data_solicitacao) < desde) return false;
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.prioridade && a.prioridade_solicitacao !== f.prioridade) return false;
      return true;
    });
    itens.sort(function (a, b) {
      var pa = a.pendente ? 0 : 1;
      var pb = b.pendente ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (!pa) return String(a.prazo_resposta || '9999').localeCompare(String(b.prazo_resposta || '9999'));
      return String(b.data_solicitacao + b.hora_solicitacao).localeCompare(String(a.data_solicitacao + a.hora_solicitacao));
    });
    var resumo = { pendentes: 0, atrasadas: 0, respondidas: 0, respondidas_com_prazo: 0, no_prazo: 0 };
    itens.forEach(function (a) {
      var i = a.prazos.interconsulta;
      if (a.pendente) { resumo.pendentes++; if (i.situacao === 'ATRASADO') resumo.atrasadas++; }
      if (i.estado === 'CUMPRIDO') {
        resumo.respondidas++;
        if (a.prazo_resposta) resumo.respondidas_com_prazo++;
        if (i.resultado === 'NO PRAZO') resumo.no_prazo++;
      }
    });
    return { itens: itens, resumo: resumo, dias: dias, agora: aux.agora };
  });
}
