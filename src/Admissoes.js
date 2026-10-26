/**
 * Admissões (cada entrada do paciente no hospital), atendimentos e atividades assistenciais.
 */

var CAMPOS_ADMISSAO_EDITAVEIS = [
  'paciente_id', 'data_admissao', 'unidade_id', 'tipo_solicitacao', 'motivo_solicitacao_id', 'data_solicitacao',
  'hora_solicitacao', 'para_quem', 'familiar_nome', 'familiar_parentesco', 'descricao_demanda',
  'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'observacoes'
];
var CAMPOS_DATA_ADMISSAO = ['data_admissao', 'data_solicitacao', 'data_desfecho'];
var CAMPOS_ENTRADA_ADMISSAO = [
  'paciente_id', 'data_admissao', 'unidade_id', 'observacoes'
];
var CAMPOS_ACOMPANHAMENTO = ['descricao_demanda', 'necessidade_acompanhamento', 'justificativa_id'];

/** Salva somente a parte exibida pela tela, preservando os demais dados da internação. */
function salvarCamposAdmissao_(dados, campos, exigirExistente, exigirAcompanhamentoAtivo) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    if (exigirExistente && !dados.id) throw new Error('Informe a admissão.');
    var atual = dados.id ? buscarPorId('ADMISSOES', dados.id) : null;
    if (dados.id && !atual) throw new Error('Admissão não encontrada.');
    if (exigirAcompanhamentoAtivo) admissaoParaRegistro(dados.id);
    if (atual && campos.indexOf('paciente_id') !== -1 && dados.paciente_id && dados.paciente_id !== atual.paciente_id) {
      throw new Error('O paciente de uma admissão existente não pode ser trocado.');
    }
    var combinado = Object.assign({}, atual || {}, { id: atual ? atual.id : '' });
    campos.forEach(function (c) {
      if (Object.prototype.hasOwnProperty.call(dados, c)) combinado[c] = dados[c];
    });
    if (exigirAcompanhamentoAtivo && combinado.justificativa_id && !buscarPorId('JUSTIFICATIVAS', combinado.justificativa_id)) {
      throw new Error('Justificativa não encontrada.');
    }
    return salvarAdmissao_(combinado, usuario, true);
  });
}

/** Entrada hospitalar: não altera demanda, acompanhamento ou desfecho. */
function apiSalvarEntradaAdmissao(dados) {
  return salvarCamposAdmissao_(dados, CAMPOS_ENTRADA_ADMISSAO, false, false);
}

/** Dados clínicos editados na tela Atendimentos. */
function apiSalvarAcompanhamento(dados) {
  return salvarCamposAdmissao_(dados, CAMPOS_ACOMPANHAMENTO, true, true);
}

/** Corrige só a descrição da demanda, em qualquer momento da internação (v27). */
function apiSalvarDescricaoDemanda(dados) {
  if (!String((dados || {}).descricao_demanda || '').trim()) return { ok: false, erro: 'Selecione a descrição da demanda.' };
  return salvarCamposAdmissao_(dados, ['descricao_demanda'], true, false);
}

/** Registra ou corrige o desfecho da admissão escolhida, mantendo seu histórico. */
function apiSalvarDesfechoAdmissao(dados) {
  return salvarCamposAdmissao_(dados, ['desfecho_id', 'data_desfecho'], true, false);
}

function mapaPorId(nome) {
  var mapa = {};
  listar(nome).forEach(function (x) { mapa[x.id] = x; });
  return mapa;
}

/** Prioridade ativa ligada a um motivo ou justificativa (ou null). */
function prioridadeDe(registro) {
  if (!registro || !registro.prioridade_id) return null;
  var p = buscarPorId('PRIORIDADES', registro.prioridade_id);
  return p && p.ativo !== 'NÃO' ? p : null;
}

/**
 * Prioridade da matriz de atendimento com o prazo em dias úteis (v27: alta 1, moderada 2, baixa 3).
 * Bancos de antes da v27 guardavam horas (24/48/72): até o "configurar" converter, 24h = 1 dia útil.
 */
function prioridadeSolicitacaoEmDias_(p) {
  if (!p || p.prazo === '' || isNaN(Number(p.prazo))) return p;
  var n = Number(p.prazo);
  if (parametro('PRAZO_SOLICITACAO_EM_DIAS', '') !== 'SIM' && n >= 24) n = Math.ceil(n / 24);
  return Object.assign({}, p, { prazo: String(n) });
}

/** { justificativa_id: dias úteis } pela prioridade de seguimento de cada justificativa. */
function prazosPorJustificativa() {
  var prazos = {};
  listar('JUSTIFICATIVAS').forEach(function (j) {
    var p = prioridadeDe(j);
    prazos[j.id] = p ? p.prazo : '';
  });
  return prazos;
}

function tiposSolicitacaoComPrazo() {
  return String(parametro('TIPOS_SOLICITACAO_COM_PRAZO', 'EQUIPE')).split(',')
    .map(function (t) { return t.trim(); }).filter(Boolean);
}

/** Valor de um parâmetro (aba PARAMETROS), com valor padrão se não existir. */
function parametro(chave, padrao) {
  var p = listar('PARAMETROS').filter(function (x) { return x.chave === chave; })[0];
  return p && p.valor !== '' ? p.valor : padrao;
}

function diasPrimeiroAtendimento() {
  var n = Number(parametro('PRAZO_PRIMEIRO_ATENDIMENTO_DIAS_UTEIS', 3));
  return isNaN(n) || n < 0 ? 3 : n;
}

function desfechoEncerraAdmissao(desfechoId) {
  var d = buscarPorId('DESFECHOS', desfechoId);
  return Boolean(d) && d.encerra_admissao === 'SIM';
}

/** Recalcula status, 1º atendimento e prazos da admissão e de seus atendimentos, e grava o que mudou. */
function recalcularAdmissao(id) {
  recalcularAdmissoes([id]);
  return buscarPorId('ADMISSOES', id);
}

function recalcularAdmissoes(ids) {
  var op = {
    prazos: prazosPorJustificativa(),
    feriados: conjuntoFeriados(listar('FERIADOS')),
    diasPrimeiro: diasPrimeiroAtendimento(),
    hoje: hoje()
  };
  var tipos = tiposSolicitacaoComPrazo();
  var momento = agora();
  var atendimentos = listar('ATENDIMENTOS');
  var mudancasAdm = {};
  var mudancasAtend = {};
  ids.forEach(function (id) {
    var adm = buscarPorId('ADMISSOES', id);
    if (!adm) return;
    var daAdmissao = atendimentos.filter(function (a) { return a.admissao_id === id; });
    var r = calcularAdmissao(adm, daAdmissao, Object.assign({ desfechoEncerra: desfechoEncerraAdmissao(adm.desfecho_id) }, op));
    var resposta = calcularResposta(adm, daAdmissao, {
      prioridade: prioridadeSolicitacaoEmDias_(prioridadeDe(buscarPorId('MOTIVOS_SOLICITACAO', adm.motivo_solicitacao_id))),
      tiposComPrazo: tipos,
      feriados: op.feriados,
      agora: momento
    });
    Object.assign(r.campos, resposta);
    var prioridadeSeguimento = prioridadeDe(buscarPorId('JUSTIFICATIVAS', adm.justificativa_id));
    r.campos.prioridade_demanda = prioridadeSeguimento ? prioridadeSeguimento.nome : '';
    if (Object.keys(r.campos).some(function (c) { return String(adm[c]) !== String(r.campos[c]); })) mudancasAdm[id] = r.campos;
    daAdmissao.forEach(function (a) {
      var novo = r.porAtendimento[a.id];
      var mudou = Object.keys(novo).some(function (c) { return String(a[c]) !== String(novo[c]); });
      if (mudou) {
        mudancasAtend[a.id] = novo;
      }
    });
  });
  atualizarVarios('ADMISSOES', mudancasAdm);
  atualizarVarios('ATENDIMENTOS', mudancasAtend);
}

/** Usado quando muda um prazo, um feriado ou um desfecho: recalcula as admissões não encerradas. */
function recalcularAdmissoesAbertas() {
  recalcularAdmissoes(listar('ADMISSOES').filter(function (a) { return a.status !== STATUS_ADMISSAO.encerrada; })
    .map(function (a) { return a.id; }));
}

function auxiliares() {
  var interconsultas = listarInterconsultas_();
  var transferencias = listarTransferencias_();
  return {
    feriados: conjuntoFeriados(listar('FERIADOS')),
    transferencias: transferencias,
    transferenciasPorAdmissao: agruparPor_(transferencias, 'admissao_id'),
    setores: mapaPorId('SETORES'),
    interconsultas: interconsultas,
    interconsultasPorAdmissao: agruparPor_(interconsultas, 'admissao_id'),
    pacientes: mapaPorId('PACIENTES'),
    unidades: mapaPorId('UNIDADES'),
    justificativas: mapaPorId('JUSTIFICATIVAS'),
    motivos: mapaPorId('MOTIVOS_SOLICITACAO'),
    desfechos: mapaPorId('DESFECHOS'),
    profissionais: mapaPorId('PROFISSIONAIS'),
    hoje: hoje(),
    agora: agora()
  };
}

/** Admissão com os nomes que a tela mostra e a situação do próximo prazo. */
function resumoAdmissao(adm, aux) {
  var solicitacoes = aux.interconsultasPorAdmissao ? (aux.interconsultasPorAdmissao[adm.id] || []) :
    aux.interconsultas.filter(function (i) { return i.admissao_id === adm.id; });
  var pendentes = solicitacoes.filter(function (i) { return i.pendente; }).sort(function (a, b) {
    return String(a.prazo_resposta || '9999').localeCompare(String(b.prazo_resposta || '9999'));
  });
  var destaque = pendentes[0] || solicitacoes[solicitacoes.length - 1];
  adm = Object.assign({}, adm);
  ['prioridade_solicitacao', 'prazo_resposta', 'momento_resposta', 'dias_resposta', 'horas_resposta', 'resposta_no_prazo'].forEach(function (c) {
    adm[c] = destaque ? destaque[c] : '';
  });
  adm.interconsultas_pendentes = pendentes.length;
  var paciente = aux.pacientes[adm.paciente_id] || {};
  var unidade = aux.unidades[adm.unidade_id] || {};
  var unidadeAtualId = unidadeNaData_(adm, aux.hoje, aux.agora.slice(11),
    aux.transferenciasPorAdmissao ? (aux.transferenciasPorAdmissao[adm.id] || []) : aux.transferencias);
  var unidadeAtual = aux.unidades[unidadeAtualId] || {};
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var desfecho = aux.desfechos[adm.desfecho_id] || {};
  var motivo = aux.motivos[adm.motivo_solicitacao_id] || {};
  // Aguardando resposta à solicitação: o prazo dela também entra na situação.
  var aguardandoResposta = pendentes.length > 0;
  var situacaoResposta = aguardandoResposta ? situacaoPrazo(adm.prazo_resposta, aux.hoje, aux.feriados) : '';
  var situacaoRetorno = adm.proximo_prazo ? situacaoPrazo(adm.proximo_prazo, aux.hoje, aux.feriados) : '';
  return Object.assign({}, adm, {
    paciente_nome: paciente.nome || '',
    prontuario: paciente.prontuario || '',
    unidade_nome: unidade.nome || '',
    unidade_admissao_nome: unidade.nome || '',
    primeiro_em_avaliacao: Boolean(normalizarData(adm.data_admissao) && normalizarData(adm.data_admissao) >= APP.inicioIndicadorPrimeiro),
    unidade_atual_id: unidadeAtualId,
    unidade_atual_nome: unidadeAtual.nome || '',
    setor_atual_id: unidadeAtual.setor_id || '',
    setor_atual_nome: (aux.setores[unidadeAtual.setor_id] || {}).nome || '',
    setor_id: unidade.setor_id || '',
    justificativa_nome: justificativa.nome || '',
    desfecho_nome: desfecho.nome || '',
    motivo_nome: motivo.nome || '',
    aguardando_resposta: aguardandoResposta,
    aberta: adm.status !== STATUS_ADMISSAO.encerrada,
    situacao: situacaoMaisUrgente(situacaoResposta, situacaoRetorno)
  });
}

var ORDEM_SITUACAO = { 'ATRASADO': 0, 'VENCE HOJE': 1, 'VENCE AMANHÃ': 2, 'NO PRAZO': 3, '': 4 };

/**
 * Admissões filtradas.
 * filtros: { abertas: 'SIM'|'NÃO'|'', status, unidade_id, setor_id, situacao, termo (nome ou prontuário) }
 */
function apiListarAdmissoes(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var aux = auxiliares();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var lista = listar('ADMISSOES').map(function (a) { return resumoAdmissao(a, aux); }).filter(function (a) {
      if (f.abertas === 'SIM' && !a.aberta) return false;
      if (f.abertas === 'NÃO' && a.aberta) return false;
      if (f.status && a.status !== f.status) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.situacao && a.situacao !== f.situacao) return false;
      if (termo && normalizarTexto(a.paciente_nome).indexOf(termo) === -1 &&
        !(prontuario && normalizarProntuario(a.prontuario) === prontuario)) return false;
      return true;
    });
    lista.sort(function (a, b) {
      var s = ORDEM_SITUACAO[a.situacao] - ORDEM_SITUACAO[b.situacao];
      if (s) return s;
      var pa = a.proximo_prazo || '9999';
      var pb = b.proximo_prazo || '9999';
      if (pa !== pb) return pa < pb ? -1 : 1;
      return String(b.data_admissao).localeCompare(String(a.data_admissao));
    });
    return lista.slice(0, Number(f.limite) || 300);
  });
}

function apiObterAdmissao(id) {
  return responder(function () {
    usuarioAtual();
    var adm = buscarPorId('ADMISSOES', id);
    if (!adm) throw new Error('Admissão não encontrada.');
    return detalheAdmissao(adm);
  });
}

/** Apresentação do prazo clínico; o resultado da interconsulta tem seu próprio vínculo e prazo. */
function prazoClinicoNoHistorico_(adm, atendimento) {
  var p = { tipo: atendimento.tipo_prazo || '', prazo: atendimento.prazo_limite || '', resultado: atendimento.no_prazo || 'NÃO AVALIADO' };
  if (p.tipo === 'PRIMEIRO' && !normalizarData(adm.data_admissao)) {
    p.prazo = '';
    p.resultado = 'NÃO AVALIADO';
  } else if (p.tipo === 'PRIMEIRO' && normalizarData(adm.data_admissao) < APP.inicioIndicadorPrimeiro) {
    p.prazo = '';
    p.resultado = 'FORA DO ESCOPO';
  } else if (atendimento.conta_prazo === 'NÃO') {
    p.prazo = '';
    p.resultado = 'NÃO CONTA';
  } else if (!p.prazo) {
    p.resultado = p.tipo ? 'SEM PRAZO' : 'NÃO AVALIADO';
  }
  return p;
}

function detalheAdmissao(adm) {
  var aux = auxiliares();
  var solicitacoes = aux.interconsultasPorAdmissao[adm.id] || [];
  var respostas = agruparPor_(solicitacoes, 'atendimento_resposta_id');
  var nomeProf = function (pid) { return (aux.profissionais[pid] || {}).nome || ''; };
  var porData = function (a, b) {
    return String(b.data).localeCompare(String(a.data)) || String(b.hora || '').localeCompare(String(a.hora || '')) ||
      String(b.criado_em).localeCompare(String(a.criado_em));
  };
  var daAdmissao = function (tabela) {
    return listar(tabela).filter(function (a) { return a.admissao_id === adm.id; }).sort(porData)
      .map(function (a) {
        var item = Object.assign({ profissional_nome: nomeProf(a.profissional_id), unidade_nome: (aux.unidades[a.unidade_id] || {}).nome || '',
          justificativa_nome: (aux.justificativas[a.justificativa_id] || {}).nome || '' }, a);
        if (tabela === 'ATENDIMENTOS') {
          item.prazo_acompanhamento = prazoClinicoNoHistorico_(adm, a);
          item.interconsultas_respondidas = (respostas[a.id] || []).map(function (i) {
            return { id: i.id, prioridade_solicitacao: i.prioridade_solicitacao, prazo_resposta: i.prazo_resposta,
              resposta_no_prazo: i.resposta_no_prazo, momento_resposta: i.momento_resposta, dias_resposta: i.dias_resposta,
              horas_resposta: i.horas_resposta };
          });
        }
        return item;
      });
  };
  var anteriores = listar('ADMISSOES').filter(function (a) { return a.paciente_id === adm.paciente_id && a.id !== adm.id; })
    .map(function (a) { return resumoAdmissao(a, aux); })
    .sort(function (a, b) { return String(b.data_admissao).localeCompare(String(a.data_admissao)); });
  return {
    admissao: resumoAdmissao(adm, aux),
    paciente: aux.pacientes[adm.paciente_id] || null,
    transferencias: transferenciasDaAdmissao_(adm, aux.transferenciasPorAdmissao[adm.id] || []).map(function (t) {
      return Object.assign({}, t, { origem_nome: (aux.unidades[t.origem_unidade_id] || {}).nome || '',
        destino_nome: (aux.unidades[t.destino_unidade_id] || {}).nome || '', profissional_nome: nomeProf(t.criado_por) });
    }),
    interconsultas: solicitacoes,
    atendimentos: daAdmissao('ATENDIMENTOS'),
    atividades: daAdmissao('ATIVIDADES'),
    desfechos: listar('DESFECHOS_REGISTRADOS').filter(function (d) { return d.admissao_id === adm.id; })
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)) || String(a.criado_em).localeCompare(String(b.criado_em)); })
      .map(function (d) {
        return Object.assign({ desfecho_nome: (aux.desfechos[d.desfecho_id] || {}).nome || '', unidade_nome: (aux.unidades[d.unidade_id] || {}).nome || '' }, d);
      }),
    outras_admissoes: anteriores
  };
}

function apiSalvarAdmissao(dados) {
  return responderGravando(function () {
    return salvarAdmissao_(dados, usuarioAtual());
  });
}

/** Gravação comum às telas e à API completa, mantida para compatibilidade. */
function salvarAdmissao_(dados, usuario, permitirJustificativaPendente) {
  var adm = {};
  CAMPOS_ADMISSAO_EDITAVEIS.forEach(function (c) {
    var v = dados[c] === undefined || dados[c] === null ? '' : String(dados[c]).trim();
    adm[c] = CAMPOS_DATA_ADMISSAO.indexOf(c) !== -1 ? normalizarData(v) : v;
  });
  adm.hora_solicitacao = normalizarHora(adm.hora_solicitacao);
  adm.para_quem = adm.para_quem === 'FAMILIAR' ? 'FAMILIAR' : 'PACIENTE';
  if (adm.para_quem === 'PACIENTE') { adm.familiar_nome = ''; adm.familiar_parentesco = ''; }
  adm.familiar_nome = formatarNome(adm.familiar_nome);
  adm.familiar_parentesco = formatarNome(adm.familiar_parentesco);
  var atual = dados.id ? buscarPorId('ADMISSOES', dados.id) : null;
  if (dados.id && !atual) throw new Error('Admissão não encontrada.');

  var erros = validarAdmissao(adm, hoje(), permitirJustificativaPendente);
  if (dados.hora_solicitacao && !adm.hora_solicitacao) erros.push('Hora da solicitação inválida.');
  if (adm.hora_solicitacao && dataHora(adm.data_solicitacao, adm.hora_solicitacao) > agora()) {
    erros.push('A solicitação não pode estar no futuro.');
  }
  if (adm.motivo_solicitacao_id && !buscarPorId('MOTIVOS_SOLICITACAO', adm.motivo_solicitacao_id)) {
    erros.push('Motivo da solicitação não encontrado.');
  }
  if (adm.paciente_id && !buscarPorId('PACIENTES', adm.paciente_id)) erros.unshift('Paciente não encontrado.');
  if (adm.unidade_id && !buscarPorId('UNIDADES', adm.unidade_id)) erros.push('Unidade não encontrada.');
  if (adm.desfecho_id && !buscarPorId('DESFECHOS', adm.desfecho_id)) erros.push('Desfecho não encontrado.');
  var primeiroAtend = atual ? atual.primeiro_atendimento : '';
  if (primeiroAtend && adm.data_admissao > primeiroAtend) erros.push('A admissão não pode ser depois do 1º atendimento.');
  var ultimoAtend = listar('ATENDIMENTOS').filter(function (a) { return atual && a.admissao_id === atual.id; })
    .reduce(function (m, a) { return a.data > m ? a.data : m; }, '');
  if (adm.data_desfecho && atual && atual.retomado_em && adm.data_desfecho < normalizarData(atual.retomado_em)) {
    erros.push('O desfecho não pode ser antes da retomada do acompanhamento.');
  }
  if (adm.data_desfecho && ultimoAtend && adm.data_desfecho < ultimoAtend) {
    erros.push('O desfecho não pode ser antes do último atendimento (' + ultimoAtend.split('-').reverse().join('/') + ').');
  }
  if (atual) listarInterconsultas_().filter(function (i) { return i.admissao_id === atual.id; }).forEach(function (i) {
    if (adm.data_admissao > i.data_solicitacao) erros.push('A admissão não pode ser depois de uma interconsulta.');
    if (adm.data_desfecho && desfechoEncerraAdmissao(adm.desfecho_id) && adm.data_desfecho < i.data_solicitacao) {
      erros.push('A saída do hospital não pode ser antes de uma interconsulta.');
    }
  });
  var outraAberta = listar('ADMISSOES').filter(function (a) {
    return a.paciente_id === adm.paciente_id && a.status !== STATUS_ADMISSAO.encerrada && a.id !== dados.id;
  })[0];
  if (outraAberta && !(adm.desfecho_id && desfechoEncerraAdmissao(adm.desfecho_id))) {
    erros.push('Este paciente já tem uma admissão aberta. Use essa admissão ou registre a saída do hospital antes.');
  }
  if (erros.length) throw new Error(erros.join(' '));

  var salvo = atual
    ? atualizar('ADMISSOES', atual.id, adm)
    : inserir('ADMISSOES', Object.assign({ criado_por: usuario.id, status: STATUS_ADMISSAO.aguardando }, adm));
  registrarDesfecho(salvo, usuario);
  return detalheAdmissao(recalcularAdmissao(salvo.id));
}

/** Desfecho atual (vigente) da admissão no histórico, se houver. */
function desfechoVigente(admissaoId) {
  return listar('DESFECHOS_REGISTRADOS').filter(function (d) {
    return d.admissao_id === admissaoId && d.vigente === 'SIM';
  })[0] || null;
}

/**
 * Mantém o histórico de desfechos de acordo com a admissão salva:
 * desfecho novo vira um lançamento; desfecho alterado corrige o lançamento vigente;
 * desfecho apagado remove o lançamento vigente (foi lançado por engano).
 */
function registrarDesfecho(adm, usuario) {
  var vigente = desfechoVigente(adm.id);
  if (!adm.desfecho_id) {
    if (vigente) excluir('DESFECHOS_REGISTRADOS', vigente.id);
    return;
  }
  var dados = {
    unidade_id: vigente && normalizarData(vigente.data) === normalizarData(adm.data_desfecho) ? vigente.unidade_id :
      unidadeNaData_(adm, adm.data_desfecho),
    desfecho_id: adm.desfecho_id,
    data: normalizarData(adm.data_desfecho),
    encerra_admissao: desfechoEncerraAdmissao(adm.desfecho_id) ? 'SIM' : 'NÃO'
  };
  if (vigente) {
    var mudou = Object.keys(dados).some(function (c) { return String(vigente[c]) !== String(dados[c]); });
    if (mudou) atualizar('DESFECHOS_REGISTRADOS', vigente.id, dados);
    return;
  }
  inserir('DESFECHOS_REGISTRADOS', Object.assign({ admissao_id: adm.id, vigente: 'SIM', criado_por: usuario.id }, dados));
}

/** Paciente teve desfecho psicológico e continua internado: o acompanhamento recomeça na mesma admissão. */
function apiRetomarAcompanhamento(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var adm = buscarPorId('ADMISSOES', dados.id);
    if (!adm) throw new Error('Admissão não encontrada.');
    if (adm.status !== STATUS_ADMISSAO.acompanhamentoEncerrado) {
      throw new Error('Só é possível retomar quando o acompanhamento foi encerrado e o paciente segue internado.');
    }
    var data = normalizarData(dados.data) || hoje();
    if (data > hoje()) throw new Error('A data não pode estar no futuro.');
    if (data < normalizarData(adm.data_desfecho)) throw new Error('A retomada não pode ser antes do desfecho.');
    if (dados.justificativa_id && !buscarPorId('JUSTIFICATIVAS', dados.justificativa_id)) throw new Error('Justificativa não encontrada.');
    var desfecho = buscarPorId('DESFECHOS', adm.desfecho_id) || {};
    var nota = 'Acompanhamento retomado em ' + data.split('-').reverse().join('/') + ' por ' + usuario.nome +
      ' (desfecho anterior: ' + (desfecho.nome || '?') + ' em ' + normalizarData(adm.data_desfecho).split('-').reverse().join('/') + ').';
    var vigente = desfechoVigente(adm.id);
    if (vigente) atualizar('DESFECHOS_REGISTRADOS', vigente.id, { vigente: 'NÃO' });
    atualizar('ADMISSOES', adm.id, {
      desfecho_id: '',
      data_desfecho: '',
      retomado_em: data,
      justificativa_id: dados.justificativa_id || adm.justificativa_id,
      necessidade_acompanhamento: dados.necessidade_acompanhamento || adm.necessidade_acompanhamento,
      observacoes: [adm.observacoes, nota].filter(Boolean).join('\n')
    });
    return detalheAdmissao(recalcularAdmissao(adm.id));
  });
}

/** Profissional informado na tela ou, se não vier, quem está logado. */
function profissionalDoRegistro(id, usuario) {
  if (!id || id === usuario.id) return usuario;
  var prof = buscarPorId('PROFISSIONAIS', id);
  if (!prof || prof.ativo !== 'SIM') throw new Error('Profissional não encontrado.');
  return prof;
}

function admissaoParaRegistro(id) {
  var adm = buscarPorId('ADMISSOES', id);
  if (!adm) throw new Error('Admissão não encontrada.');
  if (adm.status === STATUS_ADMISSAO.encerrada) throw new Error('Esta admissão está encerrada: o paciente saiu do hospital.');
  if (adm.status === STATUS_ADMISSAO.acompanhamentoEncerrado) {
    throw new Error('O acompanhamento desta admissão foi encerrado. Use "Retomar acompanhamento" para registrar.');
  }
  return adm;
}

function validarDataRegistro(data, adm) {
  if (!data) throw new Error('Informe a data.');
  if (data > hoje()) throw new Error('A data não pode estar no futuro.');
  if (data < normalizarData(adm.data_admissao)) throw new Error('A data não pode ser antes da admissão.');
  if (adm.retomado_em && data < normalizarData(adm.retomado_em)) throw new Error('A data não pode ser antes da retomada do acompanhamento.');
}

function inteiroEntre(valor, min, max, padrao) {
  var n = valor === '' || valor === undefined || valor === null ? padrao : Number(valor);
  if (!(n >= min && n <= max && Math.floor(n) === n)) return null;
  return n;
}

function apiRegistrarAtendimento(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var adm = admissaoParaRegistro(dados.admissao_id);
    var data = normalizarData(dados.data);
    validarDataRegistro(data, adm);
    var hora = normalizarHora(dados.hora);
    if (!hora) throw new Error('Informe a hora do atendimento.');
    if (dataHora(data, hora) > agora()) throw new Error('O atendimento não pode estar no futuro.');
    if (PUBLICOS_ATENDIMENTO.indexOf(dados.publico) === -1) throw new Error('Escolha se o atendimento foi ao paciente, à família ou aos dois.');
    if (TIPOS_ATENDIMENTO.indexOf(dados.tipo_atendimento) === -1) throw new Error('Selecione o tipo da solicitação: interconsulta, busca ativa, espontânea ou seguimento psicológico.');
    if (dados.tipo_atendimento === 'INTERCONSULTA' && !dados.interconsulta_id) throw new Error('Selecione a interconsulta respondida.');
    if (dados.tipo_atendimento !== 'INTERCONSULTA' && dados.interconsulta_id) throw new Error('Somente atendimento por interconsulta pode responder a uma solicitação.');
    // quantidade = número de familiares atendidos (com "PACIENTE E FAMÍLIA", o paciente conta à parte).
    var familia = atendeuFamilia(dados.publico);
    var quantidade = familia ? inteiroEntre(dados.quantidade, 1, 30, 1) : 1;
    if (quantidade === null) throw new Error('Informe quantos familiares foram atendidos (1 a 30).');
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    var justificativaId = Object.prototype.hasOwnProperty.call(dados, 'justificativa_id') ? String(dados.justificativa_id || '').trim() : adm.justificativa_id;
    if (justificativaId) {
      var justificativa = buscarPorId('JUSTIFICATIVAS', justificativaId);
      if (!justificativa || justificativa.ativo === 'NÃO') throw new Error('Selecione uma justificativa de acompanhamento válida.');
    }
    // v27: justificativa em todo atendimento ("SEM DEMANDA PARA ACOMPANHAMENTO" quando não houver seguimento).
    // Só as admissões antigas com necessidade "NÃO" ou "N / A" dispensam.
    var semAcompanhamento = SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) !== -1;
    if (!semAcompanhamento && !justificativaId) throw new Error('Selecione a justificativa no registro do atendimento.');
    // Descrição da demanda: informada no 1º atendimento (avaliação) e corrigível depois na tela da internação.
    var descricaoDemanda = String(dados.descricao_demanda || '').trim();
    if (adm.status === STATUS_ADMISSAO.aguardando && !descricaoDemanda && !adm.descricao_demanda) {
      throw new Error('Informe a descrição da demanda no 1º atendimento.');
    }
    var atendimento = {
      admissao_id: adm.id,
      unidade_id: unidadeDoRegistro_(dados, adm, data, hora),
      data: data,
      hora: hora,
      publico: dados.publico,
      tipo_atendimento: dados.tipo_atendimento,
      quantidade: quantidade,
      paciente_impossibilitado: '',
      profissional_id: prof.id,
      categoria: prof.categoria,
      justificativa_id: justificativaId || '',
      observacao: String(dados.observacao || '').trim(),
      criado_por: usuario.id
    };
    atendimento.conta_prazo = contaParaPrazo(atendimento) ? 'SIM' : 'NÃO';
    if (dados.interconsulta_id) validarRespostaInterconsulta_(dados.interconsulta_id, atendimento);
    listar('ATENDIMENTOS'); // Completa o cabeçalho do banco anterior antes de gravar.
    var salvo = inserir('ATENDIMENTOS', atendimento);
    // Registro retroativo mantém sua justificativa própria, sem substituir a do contato mais recente.
    var temContatoPosterior = listar('ATENDIMENTOS').some(function (a) {
      return a.admissao_id === adm.id && contaParaPrazo(a) && dataHora(a.data, a.hora) > dataHora(data, hora);
    });
    var mudancasAdm = {};
    if (contaParaPrazo(atendimento) && !temContatoPosterior && String(adm.justificativa_id || '') !== String(justificativaId || '')) {
      mudancasAdm.justificativa_id = justificativaId || '';
    }
    if (descricaoDemanda && descricaoDemanda !== String(adm.descricao_demanda || '')) mudancasAdm.descricao_demanda = descricaoDemanda;
    if (Object.keys(mudancasAdm).length) atualizar('ADMISSOES', adm.id, mudancasAdm);
    if (dados.interconsulta_id) atualizar('INTERCONSULTAS', dados.interconsulta_id, { atendimento_id: salvo.id });
    return detalheAdmissao(recalcularAdmissao(adm.id));
  });
}

/** Quem registrou ou a coordenação pode excluir um lançamento. */
function exigirAutorOuCoordenacao(registro, usuario) {
  if (usuario.perfil === 'COORDENAÇÃO') return;
  if (registro.criado_por === usuario.id || registro.profissional_id === usuario.id) return;
  throw new Error('Só quem registrou ou a coordenação pode excluir.');
}

function apiExcluirAtendimento(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var atendimento = buscarPorId('ATENDIMENTOS', id);
    if (!atendimento) throw new Error('Atendimento não encontrado.');
    exigirAutorOuCoordenacao(atendimento, usuario);
    excluir('ATENDIMENTOS', id);
    return detalheAdmissao(recalcularAdmissao(atendimento.admissao_id));
  });
}

function apiRegistrarAtividade(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var adm = admissaoParaRegistro(dados.admissao_id);
    var data = normalizarData(dados.data);
    validarDataRegistro(data, adm);
    var tipos = listar('LISTAS').filter(function (i) { return i.lista === 'ATIVIDADE_ASSISTENCIAL'; }).map(function (i) { return i.valor; });
    if (tipos.indexOf(dados.tipo) === -1) throw new Error('Escolha a atividade.');
    var quantidade = inteiroEntre(dados.quantidade, 1, 20, 1);
    if (quantidade === null) throw new Error('Quantidade inválida.');
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    inserir('ATIVIDADES', {
      admissao_id: adm.id, unidade_id: unidadeDoRegistro_(dados, adm, data), data: data, tipo: dados.tipo, quantidade: quantidade,
      profissional_id: prof.id, categoria: prof.categoria, criado_por: usuario.id
    });
    return detalheAdmissao(adm);
  });
}

function apiExcluirAtividade(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var atividade = buscarPorId('ATIVIDADES', id);
    if (!atividade) throw new Error('Atividade não encontrada.');
    exigirAutorOuCoordenacao(atividade, usuario);
    excluir('ATIVIDADES', id);
    return detalheAdmissao(buscarPorId('ADMISSOES', atividade.admissao_id));
  });
}
