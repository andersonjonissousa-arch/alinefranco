/**
 * Compilado: indicadores mensais por unidade ou anuais por mês. Funções puras, testadas no Node.
 */

var MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
var MESES_NOME = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO',
  'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

/** Grupos do compilado. Residentes e estagiários não entram nos números da empresa. */
var GRUPOS_COMPILADO = {
  'TODOS': 'Todos os profissionais',
  'EMPRESA': 'Profissionais da empresa',
  'RESIDENTE': 'Residentes',
  'ESTAGIÁRIO': 'Estagiários'
};

function noGrupo(categoria, grupo) {
  if (!grupo || grupo === 'TODOS') return true;
  if (grupo === 'EMPRESA') return categoria === CATEGORIA_EMPRESA;
  return categoria === grupo;
}

/** Linha do compilado: soma por coluna, percentual ou média. */
function linhaCompilado(rotulo, tipo) {
  return { rotulo: rotulo, tipo: tipo || 'n', soma: {}, cont: {} };
}

function acumular(linha, chave, valor) {
  linha.soma[chave] = (linha.soma[chave] || 0) + valor;
  linha.cont[chave] = (linha.cont[chave] || 0) + 1;
}

/**
 * Monta o compilado.
 *
 * @param dados { unidades, admissoes, atendimentos, atividades, reunioes, gerenciais, desfechosRegistrados,
 *                listas: { NOME_DA_LISTA: [valores] }, desfechos: [{ id, nome }] }
 * @param op { ano, mes (1 a 12, só no mensal), eixo: 'UNIDADE' | 'MES', grupo, setor_id, unidade_id, diasPrimeiro }
 * @return { titulo, subtitulo, colunas: [{ chave, nome }], secoes: [{ titulo, nota, semColunas, linhas }] }
 *   cada linha: { rotulo, tipo: 'n' | 'pct' | 'media', valores: [por coluna], total, destaque }
 */
function montarCompilado(dados, op) {
  var ano = String(op.ano);
  var mes = op.mes ? doisDigitos(Number(op.mes)) : '';
  var eixoUnidade = op.eixo !== 'MES';
  var grupo = op.grupo || 'TODOS';

  var unidadesValidas = {};
  var unidadesFiltradas = dados.unidades.filter(function (u) {
    var ok = (!op.setor_id || u.setor_id === op.setor_id) && (!op.unidade_id || u.id === op.unidade_id);
    if (ok) unidadesValidas[u.id] = true;
    return ok;
  });
  var semFiltroUnidade = !op.setor_id && !op.unidade_id;

  function noPeriodo(data) {
    var d = normalizarData(data);
    if (!d || d.slice(0, 4) !== ano) return false;
    return !mes || d.slice(5, 7) === mes;
  }
  function chave(data, unidadeId) {
    return eixoUnidade ? String(unidadeId || '') : normalizarData(data).slice(5, 7);
  }
  function aceita(data, unidadeId) {
    if (!noPeriodo(data)) return false;
    if (eixoUnidade) return Boolean(unidadesValidas[unidadeId]);
    return semFiltroUnidade || Boolean(unidadesValidas[unidadeId]);
  }

  var colunas = eixoUnidade
    ? unidadesFiltradas.map(function (u) { return { chave: String(u.id), nome: u.nome, ativo: u.ativo !== 'NÃO' }; })
    : MESES_ABREV.map(function (m, i) { return { chave: doisDigitos(i + 1), nome: m, ativo: true }; });

  var secoes = [];
  function secao(titulo, linhas, extra) {
    var s = Object.assign({ titulo: titulo, linhas: linhas }, extra || {});
    secoes.push(s);
    return s;
  }

  /** Uma linha por valor (lista conhecida + valores achados nos dados), mais o total. */
  function distribuicao(registros, valorDe, conhecidos, chaveDe, pesoDe) {
    var linhas = {};
    var ordem = [];
    (conhecidos || []).forEach(function (v) { linhas[v] = linhaCompilado(v); ordem.push(v); });
    var total = linhaCompilado('TOTAL');
    total.destaque = true;
    registros.forEach(function (r) {
      var v = valorDe(r) || 'NÃO INFORMADO';
      if (!linhas[v]) { linhas[v] = linhaCompilado(v); ordem.push(v); }
      var peso = pesoDe ? pesoDe(r) : 1;
      acumular(linhas[v], chaveDe(r), peso);
      acumular(total, chaveDe(r), peso);
    });
    return ordem.map(function (v) { return linhas[v]; }).concat([total]);
  }

  var porId = function (lista) {
    var m = {};
    lista.forEach(function (x) { m[x.id] = x; });
    return m;
  };
  var desfechos = porId(dados.desfechos || []);
  var qtd = function (r) { return Number(r.quantidade) || 1; };
  var notaServico = grupo === 'TODOS' ? '' : 'Serviço todo: admissões não se separam por categoria de profissional.';

  // 1. Atendimentos
  var atend = dados.atendimentos.filter(function (a) { return aceita(a.data, a.unidade_id) && noGrupo(a.categoria, grupo); });
  var lPac = linhaCompilado('PACIENTE (atendimentos)');
  var lFam = linhaCompilado('FAMÍLIA (pessoas atendidas)');
  var lFamAt = linhaCompilado('Atendimentos à família');
  var lFamImp = linhaCompilado('… com paciente impossibilitado');
  var lTot = linhaCompilado('TOTAL DE PESSOAS ATENDIDAS');
  lTot.destaque = true;
  atend.forEach(function (a) {
    var c = chave(a.data, a.unidade_id);
    if (a.publico === 'PACIENTE') {
      acumular(lPac, c, 1);
      acumular(lTot, c, 1);
    } else {
      acumular(lFam, c, qtd(a));
      acumular(lFamAt, c, 1);
      if (a.paciente_impossibilitado === 'SIM') acumular(lFamImp, c, 1);
      acumular(lTot, c, qtd(a));
    }
  });
  secao('Atendimentos', [lPac, lFam, lFamAt, lFamImp, lTot]);

  // 2. Admissões no período (pela data de admissão no hospital)
  var adms = dados.admissoes.filter(function (a) { return aceita(a.data_admissao, a.unidade_id); });
  var chaveAdm = function (a) { return chave(a.data_admissao, a.unidade_id); };
  var listas = dados.listas || {};
  var lAdm = linhaCompilado('ADMISSÕES NO PERÍODO');
  lAdm.destaque = true;
  adms.forEach(function (a) { acumular(lAdm, chaveAdm(a), 1); });
  secao('Admissões', [lAdm], { nota: notaServico });
  [
    ['Tipo de solicitação', 'tipo_solicitacao', 'TIPO_SOLICITACAO'],
    ['Descrição da solicitação', 'descricao_solicitacao', 'DESCRICAO_SOLICITACAO'],
    ['Prioridade da solicitação', 'prioridade_solicitacao', 'PRIORIDADE_SOLICITACAO'],
    ['Descrição da demanda', 'descricao_demanda', 'DESCRICAO_DEMANDA'],
    ['Prioridade da demanda', 'prioridade_demanda', 'PRIORIDADE_DEMANDA'],
    ['Necessidade de acompanhamento', 'necessidade_acompanhamento', 'NECESSIDADE_ACOMPANHAMENTO']
  ].forEach(function (d) {
    secao(d[0], distribuicao(adms, function (a) { return a[d[1]]; }, listas[d[2]], chaveAdm), { nota: notaServico });
  });

  // 3. 1º atendimento em até N dias úteis da admissão
  var lSim = linhaCompilado('NO PRAZO');
  var lNao = linhaCompilado('FORA DO PRAZO');
  var lAnd = linhaCompilado('EM ANDAMENTO');
  var lNsa = linhaCompilado('NÃO SE APLICA (desfecho antes do prazo)');
  var lPct = linhaCompilado('% NO PRAZO', 'pct');
  lPct.num = lSim;
  lPct.den = [lSim, lNao];
  lPct.destaque = true;
  var lMedia = linhaCompilado('MÉDIA DE DIAS ATÉ O 1º ATENDIMENTO', 'media');
  var mapa = { 'SIM': lSim, 'NÃO': lNao, 'EM ANDAMENTO': lAnd, 'NÃO SE APLICA': lNsa };
  adms.forEach(function (a) {
    var c = chaveAdm(a);
    if (mapa[a.primeiro_no_prazo]) acumular(mapa[a.primeiro_no_prazo], c, 1);
    if (a.dias_ate_primeiro_atendimento !== '' && a.dias_ate_primeiro_atendimento !== undefined) {
      acumular(lMedia, c, Number(a.dias_ate_primeiro_atendimento));
    }
  });
  secao('1º atendimento em até ' + op.diasPrimeiro + ' dia(s) útil(eis) da admissão', [lSim, lNao, lAnd, lNsa, lPct, lMedia], {
    nota: [notaServico, '% no prazo = no prazo ÷ (no prazo + fora do prazo). Em andamento e não se aplica ficam fora da conta.']
      .filter(Boolean).join(' ')
  });

  // 4. Retornos dentro do prazo da justificativa
  var lRetSim = linhaCompilado('NO PRAZO');
  var lRetNao = linhaCompilado('FORA DO PRAZO');
  var lRetPct = linhaCompilado('% NO PRAZO', 'pct');
  lRetPct.num = lRetSim;
  lRetPct.den = [lRetSim, lRetNao];
  lRetPct.destaque = true;
  atend.forEach(function (a) {
    if (a.tipo_prazo !== 'RETORNO') return;
    var c = chave(a.data, a.unidade_id);
    if (a.no_prazo === 'SIM') acumular(lRetSim, c, 1);
    if (a.no_prazo === 'NÃO') acumular(lRetNao, c, 1);
  });
  secao('Retornos no prazo da justificativa', [lRetSim, lRetNao, lRetPct], {
    nota: 'Atendimentos de acompanhamento que contam para o prazo (paciente, ou família com paciente impossibilitado).'
  });

  // 5. Desfechos no período, pelo histórico: conta todos, inclusive os que foram seguidos de retomada.
  var registrados = (dados.desfechosRegistrados || []).filter(function (d) { return aceita(d.data, d.unidade_id); });
  var chaveDesf = function (d) { return chave(d.data, d.unidade_id); };
  var linhasDesf = distribuicao(registrados, function (d) { return (desfechos[d.desfecho_id] || {}).nome; },
    (dados.desfechos || []).map(function (d) { return d.nome; }), chaveDesf);
  var lSaida = linhaCompilado('… saídas do hospital');
  var lSoAcomp = linhaCompilado('… só encerraram o acompanhamento');
  registrados.forEach(function (d) { acumular(d.encerra_admissao === 'SIM' ? lSaida : lSoAcomp, chaveDesf(d), 1); });
  secao('Desfechos', linhasDesf.concat([lSaida, lSoAcomp]), {
    nota: [notaServico, 'Conta todos os desfechos registrados: um paciente que teve alta psicológica, retomou e depois teve alta conta duas vezes.']
      .filter(Boolean).join(' ')
  });

  // 6. Atividades assistenciais e 7. reuniões de equipe
  var ativ = dados.atividades.filter(function (a) { return aceita(a.data, a.unidade_id) && noGrupo(a.categoria, grupo); });
  secao('Atividades assistenciais', distribuicao(ativ, function (a) { return a.tipo; }, listas.ATIVIDADE_ASSISTENCIAL,
    function (a) { return chave(a.data, a.unidade_id); }, qtd));
  var reun = dados.reunioes.filter(function (r) { return aceita(r.data, r.unidade_id) && noGrupo(r.categoria, grupo); });
  secao('Reuniões de equipe', distribuicao(reun, function (r) { return r.tipo; }, listas.REUNIAO_EQUIPE,
    function (r) { return chave(r.data, r.unidade_id); }, qtd));

  // 8. Atividades gerenciais: não têm unidade, então no mensal aparecem só com o total.
  var ger = dados.gerenciais.filter(function (g) { return noPeriodo(g.data) && noGrupo(g.categoria, grupo); });
  secao('Atividades gerenciais', distribuicao(ger, function (g) { return g.tipo; }, listas.ATIVIDADE_GERENCIAL,
    function (g) { return eixoUnidade ? '' : normalizarData(g.data).slice(5, 7); }, qtd),
  { semColunas: eixoUnidade, nota: eixoUnidade ? 'Não são ligadas a uma unidade; aparece só o total do mês.' : '' });

  // Colunas de unidades inativas só aparecem se tiverem algum número.
  var temValor = {};
  secoes.forEach(function (s) {
    s.linhas.forEach(function (l) { Object.keys(l.soma).forEach(function (k) { if (l.soma[k]) temValor[k] = true; }); });
  });
  colunas = colunas.filter(function (c) { return c.ativo || temValor[c.chave]; });

  secoes.forEach(function (s) {
    s.linhas = s.linhas.map(function (l) { return finalizarLinha(l, colunas); });
  });

  var periodo = mes ? MESES_NOME[Number(mes) - 1] + ' DE ' + ano : ano;
  return {
    titulo: (eixoUnidade ? 'COMPILADO ' : 'COMPILADO ANUAL ') + periodo,
    subtitulo: GRUPOS_COMPILADO[grupo] || grupo,
    colunas: colunas.map(function (c) { return { chave: c.chave, nome: c.nome }; }),
    secoes: secoes
  };
}

function finalizarLinha(l, colunas) {
  var valor = function (k) {
    if (l.tipo === 'pct') {
      var den = l.den.reduce(function (s, d) { return s + (d.soma[k] || 0); }, 0);
      return den ? (l.num.soma[k] || 0) / den : null;
    }
    if (l.tipo === 'media') return l.cont[k] ? l.soma[k] / l.cont[k] : null;
    return l.soma[k] || 0;
  };
  var somaTudo = function (obj) { return Object.keys(obj).reduce(function (s, k) { return s + obj[k]; }, 0); };
  var total;
  if (l.tipo === 'pct') {
    var den = l.den.reduce(function (s, d) { return s + somaTudo(d.soma); }, 0);
    total = den ? somaTudo(l.num.soma) / den : null;
  } else if (l.tipo === 'media') {
    var n = somaTudo(l.cont);
    total = n ? somaTudo(l.soma) / n : null;
  } else {
    total = somaTudo(l.soma);
  }
  return {
    rotulo: l.rotulo,
    tipo: l.tipo,
    destaque: Boolean(l.destaque),
    valores: colunas.map(function (c) { return valor(c.chave); }),
    total: total
  };
}

/** Texto de um valor do compilado: inteiro, percentual ou média com uma casa. */
function formatarValorCompilado(valor, tipo) {
  if (valor === null || valor === undefined) return '—';
  if (tipo === 'pct') return Math.round(valor * 100) + '%';
  if (tipo === 'media') return (Math.round(valor * 10) / 10).toString().replace('.', ',');
  return String(valor);
}

/** Compilado em linhas e colunas, para gravar numa planilha. */
function compiladoEmTabela(c) {
  var largura = c.colunas.length + 2;
  var vazia = function () { var l = []; for (var i = 0; i < largura; i++) l.push(''); return l; };
  var linhas = [];
  var tipos = [];
  var push = function (l, tipo) {
    while (l.length < largura) l.push('');
    linhas.push(l);
    tipos.push(tipo);
  };
  push([c.titulo], 'titulo');
  push([c.subtitulo], 'subtitulo');
  push(vazia(), 'vazia');
  c.secoes.forEach(function (s) {
    push([s.titulo.toUpperCase()].concat(s.semColunas ? [] : c.colunas.map(function (col) { return col.nome; })).concat(s.semColunas ? [] : ['TOTAL']), 'cabecalho');
    if (s.semColunas) linhas[linhas.length - 1][1] = 'TOTAL';
    s.linhas.forEach(function (l) {
      var valores = s.semColunas ? [] : l.valores.map(function (v) { return formatarValorCompilado(v, l.tipo); });
      var linha = [l.rotulo].concat(valores).concat([formatarValorCompilado(l.total, l.tipo)]);
      push(linha, l.destaque ? 'destaque' : 'linha');
    });
    if (s.nota) push([s.nota], 'nota');
    push(vazia(), 'vazia');
  });
  return { linhas: linhas, tipos: tipos, largura: largura };
}
