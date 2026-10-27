/**
 * Compilado (tela e exportação) e registro do dia: reuniões de equipe e atividades gerenciais.
 */

function opcoesCompilado(f) {
  var ano = Number(f.ano);
  if (!(ano >= 2020 && ano <= 2100)) throw new Error('Escolha o ano.');
  var eixo = f.eixo === 'MES' ? 'MES' : 'UNIDADE';
  var mes = eixo === 'UNIDADE' ? Number(f.mes) : null;
  if (eixo === 'UNIDADE' && !(mes >= 1 && mes <= 12)) throw new Error('Escolha o mês.');
  if (f.grupo && !GRUPOS_COMPILADO[f.grupo]) throw new Error('Grupo inválido.');
  return {
    ano: ano, mes: mes, eixo: eixo, grupo: f.grupo || 'TODOS',
    setor_id: f.setor_id || '', unidade_id: f.unidade_id || '', diasPrimeiro: diasPrimeiroAtendimento()
  };
}

function gerarCompilado(f) {
  var listas = {};
  listar('LISTAS').slice().sort(porOrdem).forEach(function (i) {
    if (i.ativo !== 'SIM') return;
    (listas[i.lista] = listas[i.lista] || []).push(i.valor);
  });
  return montarCompilado({
    unidades: listar('UNIDADES').slice().sort(porOrdem),
    admissoes: listar('ADMISSOES'),
    interconsultas: listarInterconsultas_(),
    descricoes: listarDescricoesDemanda_(),
    atendimentos: listar('ATENDIMENTOS'),
    atividades: listar('ATIVIDADES'),
    reunioes: listar('REUNIOES'),
    gerenciais: listar('GERENCIAIS'),
    desfechosRegistrados: listar('DESFECHOS_REGISTRADOS'),
    motivos: listar('MOTIVOS_SOLICITACAO').slice().sort(porOrdem),
    prioridades: listar('PRIORIDADES').filter(function (p) { return p.ativo !== 'NÃO'; }).sort(porOrdem),
    listas: listas,
    desfechos: listar('DESFECHOS').slice().sort(porOrdem)
  }, opcoesCompilado(f));
}

function apiCompilado(filtros) {
  return responder(function () {
    usuarioAtual();
    return gerarCompilado(filtros || {});
  });
}

/** Cria uma planilha nova no Drive de quem exportou, com o compilado formatado. Devolve o endereço. */
function apiExportarCompilado(filtros) {
  return responder(function () {
    usuarioAtual();
    var c = gerarCompilado(filtros || {});
    var t = compiladoEmTabela(c);
    var planilha = SpreadsheetApp.create(c.titulo + ' — ' + c.subtitulo);
    var aba = planilha.getSheets()[0];
    aba.setName('Compilado');
    aba.getRange(1, 1, t.linhas.length, t.largura).setNumberFormat('@').setValues(t.linhas);
    t.tipos.forEach(function (tipo, i) {
      var linha = aba.getRange(i + 1, 1, 1, t.largura);
      if (tipo === 'titulo') linha.setFontWeight('bold').setFontSize(14);
      else if (tipo === 'cabecalho') linha.setFontWeight('bold').setBackground('#dbe7f3');
      else if (tipo === 'destaque') linha.setFontWeight('bold').setBackground('#f3f6f9');
      else if (tipo === 'nota') linha.setFontStyle('italic').setFontColor('#616e7c');
    });
    aba.setColumnWidth(1, 320);
    aba.setFrozenColumns(1);
    return { url: planilha.getUrl(), nome: planilha.getName() };
  });
}

// ---------- Registro do dia: reuniões de equipe e atividades gerenciais ----------

function valoresDaLista(nome) {
  return listar('LISTAS').filter(function (i) { return i.lista === nome && i.ativo === 'SIM'; }).map(function (i) { return i.valor; });
}

function dadosRegistroGeral(dados, usuario, lista) {
  var data = normalizarData(dados.data);
  if (!data) throw new Error('Informe a data.');
  if (data > hoje()) throw new Error('A data não pode estar no futuro.');
  if (valoresDaLista(lista).indexOf(dados.tipo) === -1) throw new Error('Escolha o tipo.');
  var quantidade = inteiroEntre(dados.quantidade, 1, 50, 1);
  if (quantidade === null) throw new Error('Quantidade inválida.');
  var prof = profissionalDoRegistro(dados.profissional_id, usuario);
  return {
    data: data, tipo: dados.tipo, quantidade: quantidade,
    profissional_id: prof.id, categoria: prof.categoria, criado_por: usuario.id
  };
}

function apiRegistrarReuniao(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var registro = dadosRegistroGeral(dados, usuario, 'REUNIAO_EQUIPE');
    if (!buscarPorId('UNIDADES', dados.unidade_id)) throw new Error('Escolha a unidade.');
    registro.unidade_id = dados.unidade_id;
    inserir('REUNIOES', registro);
    return registrosDoMes(dados.data);
  });
}

function apiRegistrarGerencial(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    inserir('GERENCIAIS', dadosRegistroGeral(dados, usuario, 'ATIVIDADE_GERENCIAL'));
    return registrosDoMes(dados.data);
  });
}

/** Reuniões e atividades gerenciais do mês da data, mais recentes primeiro. */
function registrosDoMes(data) {
  var mes = mesReferencia(data) || mesReferencia(hoje());
  var profs = mapaPorId('PROFISSIONAIS');
  var unidades = mapaPorId('UNIDADES');
  var doMes = function (tabela) {
    return listar(tabela).filter(function (r) { return mesReferencia(r.data) === mes; })
      .sort(function (a, b) { return String(b.data).localeCompare(String(a.data)) || String(b.criado_em).localeCompare(String(a.criado_em)); })
      .map(function (r) {
        return Object.assign({
          profissional_nome: (profs[r.profissional_id] || {}).nome || '',
          unidade_nome: (unidades[r.unidade_id] || {}).nome || ''
        }, r);
      });
  };
  return { mes: mes, reunioes: doMes('REUNIOES'), gerenciais: doMes('GERENCIAIS') };
}

function apiRegistrosDoMes(data) {
  return responder(function () {
    usuarioAtual();
    return registrosDoMes(data);
  });
}

function apiExcluirReuniao(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var r = buscarPorId('REUNIOES', id);
    if (!r) throw new Error('Registro não encontrado.');
    exigirAutorOuCoordenacao(r, usuario);
    excluir('REUNIOES', id);
    return registrosDoMes(r.data);
  });
}

function apiExcluirGerencial(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var r = buscarPorId('GERENCIAIS', id);
    if (!r) throw new Error('Registro não encontrado.');
    exigirAutorOuCoordenacao(r, usuario);
    excluir('GERENCIAIS', id);
    return registrosDoMes(r.data);
  });
}
