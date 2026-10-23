/** Indicadores assistenciais: percentuais e casos, separados da produção do compilado. */
function resumoIndicador_(itens) {
  var r = { total: itens.length, no_prazo: 0, fora_prazo: 0, em_andamento: 0,
    nao_se_aplica: 0, sem_prazo: 0, dados_pendentes: 0, fora_escopo: 0, atrasados_abertos: 0 };
  var campos = { 'SIM': 'no_prazo', 'NÃO': 'fora_prazo', 'EM ANDAMENTO': 'em_andamento',
    'NÃO SE APLICA': 'nao_se_aplica', 'SEM PRAZO': 'sem_prazo',
    'DADOS PENDENTES': 'dados_pendentes', 'FORA DO ESCOPO': 'fora_escopo' };
  itens.forEach(function (i) {
    if (campos[i.resultado]) r[campos[i.resultado]]++;
    if (i.resultado === 'NÃO' && !i.realizado && !i.encerrado) r.atrasados_abertos++;
  });
  r.avaliados = r.no_prazo + r.fora_prazo;
  r.percentual = r.avaliados ? r.no_prazo / r.avaliados : null;
  return r;
}

/** Função pura: datas ISO, grupos e uma obrigação por retorno, mesmo com vários contatos no dia. */
function montarPainelIndicadores(dados, op) {
  var mapas = function (lista) {
    var m = {};
    (lista || []).forEach(function (x) { m[x.id] = x; });
    return m;
  };
  var pacientes = mapas(dados.pacientes), unidades = mapas(dados.unidades);
  var justificativas = mapas(dados.justificativas), prioridades = mapas(dados.prioridades);
  var mes = String(op.ano) + '-' + doisDigitos(Number(op.mes));
  var feriados = conjuntoFeriados(dados.feriados || []);
  var agoraDh = op.agora, hojeIso = agoraDh.slice(0, 10);
  var primeiro = [], interconsultas = [], retornos = [];
  var admissoes = mapas(dados.admissoes);
  var atendimentos = {}, desfechos = {};
  (dados.atendimentos || []).forEach(function (a) {
    (atendimentos[a.admissao_id] = atendimentos[a.admissao_id] || []).push(a);
  });
  (dados.desfechos || []).forEach(function (d) {
    (desfechos[d.admissao_id] = desfechos[d.admissao_id] || []).push(normalizarData(d.data));
  });
  function aceita(adm, data, unidadeId) {
    if (normalizarData(data).slice(0, 7) !== mes) return false;
    var u = unidades[unidadeId] || {};
    if (op.setor_id && op.setor_id !== u.setor_id) return false;
    if (op.unidade_id && op.unidade_id !== unidadeId) return false;
    var p = pacientes[adm.paciente_id] || {};
    var termo = normalizarTexto(op.termo);
    return !termo || normalizarTexto(p.nome).indexOf(termo) !== -1 || String(p.prontuario || '') === normalizarProntuario(op.termo);
  }
  function caso(adm, unidadeId, campos) {
    var p = pacientes[adm.paciente_id] || {}, u = unidades[unidadeId] || {};
    return Object.assign({ admissao_id: adm.id, paciente_nome: p.nome || '', prontuario: p.prontuario || '',
      unidade_nome: u.nome || '', unidade_id: unidadeId }, campos);
  }
  function resultado(prazo, realizado, encerramento) {
    if (!prazo) return 'SEM PRAZO';
    if (realizado) return realizado <= prazo ? 'SIM' : 'NÃO';
    if (encerramento && encerramento <= prazo.slice(0, 10)) return 'NÃO SE APLICA';
    if (encerramento || (prazo.length > 10 ? agoraDh : hojeIso) > prazo) return 'NÃO';
    return 'EM ANDAMENTO';
  }
  (dados.admissoes || []).forEach(function (adm) {
    var contatos = (atendimentos[adm.id] || []).filter(function (a) {
      return contaParaPrazo(a) && normalizarData(a.data) && a.data <= hojeIso;
    }).slice().sort(function (a, b) {
      return String(a.data).localeCompare(String(b.data)) || String(a.hora || '').localeCompare(String(b.hora || '')) ||
        String(a.criado_em || '').localeCompare(String(b.criado_em || ''));
    });
    if (aceita(adm, adm.data_admissao, adm.unidade_id)) {
      var entrada = normalizarData(adm.data_admissao);
      var dataPrimeiro = contatos.length ? normalizarData(contatos[0].data) : normalizarData(adm.primeiro_atendimento);
      var prazoPrimeiro = adicionarDiasUteis(entrada, op.diasPrimeiro, feriados);
      var situacao = entrada < op.inicioPrimeiro ? 'FORA DO ESCOPO' :
        resultado(prazoPrimeiro, dataPrimeiro, normalizarData(adm.data_desfecho));
      if (!entrada || (dataPrimeiro && (dataPrimeiro < entrada || dataPrimeiro > hojeIso))) situacao = 'DADOS PENDENTES';
      primeiro.push(caso(adm, adm.unidade_id, { id: adm.id, referencia: entrada, prazo: prazoPrimeiro,
        realizado: dataPrimeiro, resultado: situacao, encerrado: Boolean(adm.desfecho_id), grupo: 'Todas as admissões' }));
    }

    // Um dia de atendimento abre um único próximo retorno. A justificativa daquele dia
    // define a obrigação histórica, mesmo quando a justificativa atual mudou.
    var dias = [];
    contatos.forEach(function (a) {
      if (dias.length && dias[dias.length - 1].data === a.data) dias[dias.length - 1] = a;
      else dias.push(a);
    });
    var retomada = normalizarData(adm.retomado_em);
    if (retomada && retomada <= hojeIso && !dias.some(function (a) { return a.data === retomada; })) {
      var apos = dias.filter(function (a) { return a.data > retomada; })[0];
      dias.push({ id: 'retomada_' + adm.id, data: retomada, unidade_id: adm.unidade_id,
        justificativa_id: apos ? apos.justificativa_id : adm.justificativa_id });
      dias.sort(function (a, b) { return a.data.localeCompare(b.data); });
    }
    var encerramentos = (desfechos[adm.id] || []).slice();
    if (adm.data_desfecho) encerramentos.push(normalizarData(adm.data_desfecho));
    encerramentos = encerramentos.filter(Boolean).sort();
    dias.forEach(function (origem, index) {
      var proximo = dias[index + 1];
      var fim = encerramentos.filter(function (d) {
        // Um desfecho antigo na própria data da retomada não encerra o novo ciclo.
        var anteriorARetomada = retomada && origem.data >= retomada && d <= retomada && d !== normalizarData(adm.data_desfecho);
        return d >= origem.data && !anteriorARetomada;
      })[0] || '';
      var realizado = proximo && (!fim || proximo.data <= fim) ? proximo.data : '';
      // Uma retomada é o começo de um novo ciclo, não a resposta ao retorno anterior.
      if (proximo && String(proximo.id).indexOf('retomada_') === 0) realizado = '';
      var atual = !proximo && !fim;
      var justificativaId = atual ? (adm.justificativa_id || origem.justificativa_id) : origem.justificativa_id;
      var j = justificativas[justificativaId] || {};
      var p = prioridades[j.prioridade_id] || {};
      var temPrazo = p.prazo !== '' && p.prazo !== undefined && !isNaN(Number(p.prazo));
      var prazo = temPrazo ? adicionarDiasUteis(origem.data, Number(p.prazo), feriados) : '';
      var referencia = prazo || origem.data;
      var unidadeId = origem.unidade_id || adm.unidade_id;
      if (!aceita(adm, referencia, unidadeId)) return;
      var r = !justificativaId ? 'DADOS PENDENTES' : resultado(prazo, realizado, fim);
      if (atual && SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) !== -1) r = 'NÃO SE APLICA';
      retornos.push(caso(adm, unidadeId, { id: origem.id, referencia: referencia, inicio: origem.data,
        prazo: prazo, prazo_dias: temPrazo ? Number(p.prazo) : null, realizado: realizado, resultado: r,
        encerrado: Boolean(fim), grupo: j.nome || 'Justificativa não informada', prioridade: p.nome || '' }));
    });
  });
  (dados.interconsultas || []).forEach(function (i) {
    var adm = admissoes[i.admissao_id];
    if (!adm || i.excluido_em || !aceita(adm, i.data_solicitacao, i.unidade_id)) return;
    interconsultas.push(caso(adm, i.unidade_id, { id: i.id, referencia: dataHora(i.data_solicitacao, i.hora_solicitacao),
      prazo: i.prazo_resposta || '', realizado: i.momento_resposta || '', resultado: i.resposta_no_prazo || 'DADOS PENDENTES',
      encerrado: !i.pendente && !i.momento_resposta, grupo: i.prioridade_solicitacao || 'Sem prioridade', motivo: i.motivo_nome || '' }));
  });
  function indicador(itens, criterio) {
    var grupos = {};
    itens.forEach(function (i) { (grupos[i.grupo] = grupos[i.grupo] || []).push(i); });
    itens.sort(function (a, b) {
      var ordem = { 'NÃO': 0, 'EM ANDAMENTO': 1, 'DADOS PENDENTES': 2, 'SIM': 3 };
      return (ordem[a.resultado] === undefined ? 4 : ordem[a.resultado]) - (ordem[b.resultado] === undefined ? 4 : ordem[b.resultado]) ||
        String(a.prazo).localeCompare(String(b.prazo));
    });
    return { resumo: resumoIndicador_(itens), criterio: criterio,
      grupos: Object.keys(grupos).sort().map(function (nome) { return { nome: nome, resumo: resumoIndicador_(grupos[nome]) }; }),
      casos: itens.slice(0, 300), total_casos: itens.length };
  }
  return { mes: mes, agora: agoraDh, inicio_primeiro: op.inicioPrimeiro, dias_primeiro: op.diasPrimeiro,
    primeiro: indicador(primeiro, 'Admissões no mês selecionado. Indicador válido para entradas a partir de ' + op.inicioPrimeiro + '.'),
    interconsultas: indicador(interconsultas, 'Solicitações feitas no mês selecionado. Prazo em horas úteis, excluindo sábados, domingos e feriados, pela prioridade de cada solicitação.'),
    acompanhamento: indicador(retornos, 'Retornos cujo prazo vence no mês selecionado, em dias úteis pela justificativa do atendimento anterior. Cada intervalo conta uma vez.') };
}

function apiIndicadores(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var ano = Number(f.ano), mes = Number(f.mes);
    if (!Number.isInteger(ano) || ano < 2020 || ano > 2100 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      throw new Error('Selecione um mês e ano válidos.');
    }
    if (f.unidade_id && !buscarPorId('UNIDADES', f.unidade_id)) throw new Error('Unidade não encontrada.');
    if (f.setor_id && !buscarPorId('SETORES', f.setor_id)) throw new Error('Setor não encontrado.');
    return montarPainelIndicadores({ pacientes: listar('PACIENTES'), unidades: listar('UNIDADES'),
      admissoes: listar('ADMISSOES'), atendimentos: listar('ATENDIMENTOS'), interconsultas: listarInterconsultas_(),
      justificativas: listar('JUSTIFICATIVAS'), prioridades: listar('PRIORIDADES'),
      feriados: listar('FERIADOS'), desfechos: listar('DESFECHOS_REGISTRADOS') },
    { ano: ano, mes: mes, setor_id: f.setor_id || '', unidade_id: f.unidade_id || '', termo: f.termo || '',
      agora: agora(), diasPrimeiro: diasPrimeiroAtendimento(), inicioPrimeiro: APP.inicioIndicadorPrimeiro });
  });
}
