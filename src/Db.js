/**
 * Acesso às abas do banco como tabelas. Cada linha vira um objeto
 * cujas chaves são os nomes das colunas definidos em TABELAS.
 */

var _cacheTabelas = {};
var _indicesTabelas = {};

/** Índice por id em memória, refeito sozinho quando a tabela é lida ou gravada de novo. */
function indicePorId_(nome) {
  var lista = listar(nome);
  var indice = _indicesTabelas[nome];
  if (!indice || indice.lista !== lista) {
    var mapa = Object.create(null);
    lista.forEach(function (r) { if (!mapa[String(r.id)]) mapa[String(r.id)] = r; });
    indice = _indicesTabelas[nome] = { lista: lista, mapa: mapa };
  }
  return indice.mapa;
}

function agruparPor_(registros, campo) {
  var grupos = Object.create(null);
  registros.forEach(function (r) { (grupos[r[campo]] = grupos[r[campo]] || []).push(r); });
  return grupos;
}

var _banco = null;
// Usado só pelo autoteste: aponta o sistema para uma planilha de teste durante a execução.
var _bancoTeste = null;

/** Planilha do banco, aberta uma vez por execução. */
function abrirBanco() {
  if (_bancoTeste) return _bancoTeste;
  if (_banco) return _banco;
  var id = PropertiesService.getScriptProperties().getProperty(APP.propDbId);
  _banco = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!_banco) throw new Error('Banco não configurado. Rode a função "configurar" no editor do Apps Script.');
  return _banco;
}

function abaDaTabela(nome) {
  if (!TABELAS[nome]) throw new Error('Tabela desconhecida: ' + nome);
  var aba = abrirBanco().getSheetByName(nome);
  if (!aba) throw new Error('Aba "' + nome + '" não existe. Rode a função "configurar".');
  return aba;
}

/** Todas as linhas da tabela, como objetos. Lê o banco uma vez por execução. */
function listar(nome) {
  if (!_cacheTabelas[nome]) carregarTabelas(nome);
  return _cacheTabelas[nome];
}

// Como a última leitura foi feita: 'API' (uma consulta para todas as abas) ou 'ABAS' (aba por aba).
var _modoLeitura = '';
// Usado só pela medição de desempenho, para comparar com a leitura e a gravação aba por aba.
var _forcarLeituraPorAba = false;
// Se a API falhar uma vez, o resto da execução lê aba por aba sem tentar de novo.
var _apiIndisponivel = false;

/**
 * Lê numa consulta só, pela API do Google Planilhas, todas as tabelas que ainda não estão no cache.
 * Cada consulta ao Google custa um tempo fixo, então ler tudo junto é bem mais rápido que aba por aba.
 * A leitura traz o cabeçalho: se faltar coluna ou aba nova, ela é acrescentada sem mexer nos dados.
 * Se a API não estiver disponível, lê só a tabela pedida, aba por aba.
 */
function carregarTabelas(pedida) {
  if (!TABELAS[pedida]) throw new Error('Tabela desconhecida: ' + pedida);
  if (!_forcarLeituraPorAba && !_apiIndisponivel && typeof Sheets !== 'undefined') {
    var nomes = Object.keys(TABELAS).filter(function (n) { return !_cacheTabelas[n]; });
    try {
      var faixas = lerPelaApi(nomes);
      var migrar = nomes.filter(function (nome, i) { return precisaPrepararAba(nome, ((faixas[i] && faixas[i].values) || [])[0]); });
      if (migrar.length) prepararAbas(migrar);
      nomes.forEach(function (nome, i) {
        _cacheTabelas[nome] = registrosDe(nome, ((faixas[i] && faixas[i].values) || []).slice(1));
      });
      _modoLeitura = 'API';
      return;
    } catch (e) {
      _apiIndisponivel = true;
      if (!_semRegistroDeErros) console.warn('Leitura pela API do Google Planilhas falhou; lendo aba por aba. ' + e.message);
    }
  }
  var aba = abrirBanco().getSheetByName(pedida);
  if (!aba) {
    prepararAbas([pedida]);
    aba = abaDaTabela(pedida);
  }
  var colunas = TABELAS[pedida];
  var ultima = aba.getLastRow();
  var valores = ultima < 1 ? [] : aba.getRange(1, 1, ultima, colunas.length).getValues();
  if (precisaPrepararAba(pedida, valores[0])) prepararAbas([pedida]);
  _cacheTabelas[pedida] = registrosDe(pedida, valores.slice(1));
  _modoLeitura = 'ABAS';
}

/** Uma consulta pela API. Se alguma aba ainda não existir (versão nova do sistema), cria e tenta de novo. */
function lerPelaApi(nomes) {
  // Dentro de uma gravação, o que ainda não foi para a planilha vai antes da leitura.
  if (_pendenteNaPlanilha) {
    SpreadsheetApp.flush();
    _pendenteNaPlanilha = false;
  }
  if (_travaAtiva) enviarGravacoes();
  var consulta = function () {
    return Sheets.Spreadsheets.Values.batchGet(idDoBanco(), {
      ranges: nomes.map(intervaloDaTabela),
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER'
    }).valueRanges || [];
  };
  try {
    return consulta();
  } catch (e) {
    var existentes = abrirBanco().getSheets().map(function (a) { return a.getName(); });
    var faltando = nomes.filter(function (n) { return existentes.indexOf(n) === -1; });
    if (!faltando.length) throw e;
    prepararAbas(faltando);
    return consulta();
  }
}

/** O cabeçalho da aba não tem todas as colunas da tabela (coluna ou aba nova). */
function precisaPrepararAba(nome, cabecalho) {
  return TABELAS[nome].some(function (col, i) { return !cabecalho || cabecalho[i] !== col; });
}

/** Cria a aba ou acrescenta as colunas que faltam no cabeçalho (ver prepararAba, em Setup.js). */
function prepararAbas(nomes) {
  comTrava(function () {
    nomes.forEach(function (nome) { prepararAba(abrirBanco(), nome); });
    SpreadsheetApp.flush();
  });
}

var _idBanco = '';

function idDoBanco() {
  if (_bancoTeste) return _bancoTeste.getId();
  if (!_idBanco) _idBanco = PropertiesService.getScriptProperties().getProperty(APP.propDbId) || abrirBanco().getId();
  return _idBanco;
}

/** Ex.: 'ATENDIMENTOS'!A1:R — do cabeçalho até o fim, só as colunas da tabela. */
function intervaloDaTabela(nome) {
  return "'" + nome + "'!A1:" + letraDaColuna(TABELAS[nome].length);
}

function letraDaColuna(n) {
  var letras = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) letras = String.fromCharCode(65 + (n - 1) % 26) + letras;
  return letras;
}

// Colunas de data e hora. Se a planilha converteu o texto em data, a API devolve o número de série.
var COLUNA_DE_DATA = /^(data(_.*)?|prazo_(primeiro_atendimento|limite|resposta)|primeiro_atendimento|ultimo_contato|proximo_prazo|retomado_em|momento_resposta|hora(_.*)?|.*_em)$/;

// Linha de cada registro na aba, por tabela e id ({ ATENDIMENTOS: { id: 7 } }). Vem junto com a leitura.
var _linhas = {};

/**
 * Linhas da aba (a partir da linha 2) viram objetos. A API omite as células vazias do fim; aqui voltam como ''.
 * Guarda também em que linha da aba está cada id, para gravar sem precisar procurar.
 */
function registrosDe(nome, linhas) {
  var colunas = TABELAS[nome];
  var registros = [];
  var posicao = _linhas[nome] = {};
  linhas.forEach(function (linha, i) {
    if (linha[0] === '' || linha[0] === undefined) return;
    posicao[String(linha[0])] = i + 2;
    var obj = {};
    colunas.forEach(function (col, i) {
      var v = linha[i] === undefined ? '' : linha[i];
      if (typeof v === 'number' && COLUNA_DE_DATA.test(col)) v = dataDoNumeroDeSerie(v);
      obj[col] = Object.prototype.toString.call(v) === '[object Date]' ? normalizarDataHora(col, v) : v;
    });
    registros.push(obj);
  });
  return registros;
}

/** Número de série da planilha (dias desde 30/12/1899, no fuso do hospital) para Date. */
function dataDoNumeroDeSerie(serie) {
  var relogio = new Date(Math.round((serie - 25569) * 86400000)).toISOString().slice(0, 19).replace('T', ' ');
  return Utilities.parseDate(relogio, APP.fusoHorario, 'yyyy-MM-dd HH:mm:ss');
}

/** Datas lidas da planilha voltam como texto: 'AAAA-MM-DD' ou data e hora ISO nos carimbos *_em. */
function normalizarDataHora(coluna, valor) {
  if (/_em$/.test(coluna)) return valor.toISOString();
  if (/^hora/.test(coluna)) return normalizarHora(valor);
  return normalizarData(valor);
}

function buscarPorId(nome, id) {
  return indicePorId_(nome)[String(id)] || null;
}

function novoId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function agoraIso() {
  return new Date().toISOString();
}

/** Data e hora de agora no fuso do hospital, 'AAAA-MM-DD HH:MM'. */
function agora() {
  return Utilities.formatDate(new Date(), APP.fusoHorario, 'yyyy-MM-dd HH:mm');
}

/** Data de hoje no fuso do hospital, 'AAAA-MM-DD'. */
function hoje() {
  return Utilities.formatDate(new Date(), APP.fusoHorario, 'yyyy-MM-dd');
}

/** A gravação pode usar a API do Google Planilhas? (Senão, usa a planilha aba por aba, como antes.) */
function gravarPelaApi() {
  return !_forcarLeituraPorAba && !_apiIndisponivel && typeof Sheets !== 'undefined';
}

// Linhas alteradas na operação atual, enviadas de uma vez só quando a operação termina: { intervalo: valores }.
var _gravacoes = {};
// Linhas novas da operação atual, por tabela, acrescentadas de uma vez no fim: { tabela: { ids: [], linhas: [] } }.
// O Google limita as gravações por minuto de cada usuário: uma gravação por linha estourava o limite no configurar.
var _insercoes = {};
// Houve gravação pela planilha (SpreadsheetApp) que ainda precisa ser enviada antes de soltar a trava.
var _pendenteNaPlanilha = false;

/** Insere o registro (gera id se faltar) e devolve o registro gravado. */
function inserir(nome, registro) {
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var obj = Object.assign({}, registro);
    if (!obj.id) obj.id = novoId();
    if (colunas.indexOf('criado_em') !== -1 && !obj.criado_em) obj.criado_em = agoraIso();
    var valores = linhaDe(colunas, obj);
    if (!gravarPelaApi()) {
      abaDaTabela(nome).appendRow(valores);
      _pendenteNaPlanilha = true;
      delete _cacheTabelas[nome];
      return obj;
    }
    // Vai para a planilha no fim da operação, junto com as outras linhas novas da mesma aba.
    var pendentes = _insercoes[nome] = _insercoes[nome] || { ids: [], linhas: [] };
    pendentes.ids.push(String(obj.id));
    pendentes.linhas.push(valores);
    // Quem ler a tabela depois, na mesma operação, já vê o registro novo.
    if (_cacheTabelas[nome]) {
      _cacheTabelas[nome].push(registroDeValores(colunas, valores));
      delete _indicesTabelas[nome];
    }
    return obj;
  });
}

/** Atualiza só os campos enviados do registro com esse id (e marca atualizado_em). */
function atualizar(nome, id, campos) {
  var mudancas = {};
  mudancas[id] = campos;
  return atualizarVarios(nome, mudancas, true)[0];
}

/**
 * Atualiza vários registros de uma vez: { id: { campo: valor } }. Devolve os registros como ficaram.
 * unico = true (vindo de atualizar): o registro tem que existir e atualizado_em é marcado.
 * Sem ele (recálculos), quem não existe é ignorado e atualizado_em fica como está.
 * Pela API, a linha já conhecida é gravada no fim da operação, junto com as outras, e a leitura em
 * memória é atualizada na hora: quem ler depois já vê o valor novo, sem consultar a planilha de novo.
 */
function atualizarVarios(nome, mudancas, unico) {
  var ids = Object.keys(mudancas);
  if (!ids.length) return [];
  return comTrava(function () {
    var colunas = TABELAS[nome];
    if (!gravarPelaApi()) return atualizarNaPlanilha(nome, mudancas, unico);
    var lista = listar(nome);
    var indice = {};
    lista.forEach(function (r, i) { indice[String(r.id)] = i; });
    var gravados = [];
    var pendentes = _insercoes[nome] || { ids: [], linhas: [] };
    ids.forEach(function (id) {
      var i = indice[String(id)];
      var linha = _linhas[nome][String(id)];
      // Registro inserido nesta mesma operação: muda a linha que ainda vai ser acrescentada.
      var novo = pendentes.ids.lastIndexOf(String(id));
      if (i === undefined || (!linha && novo === -1)) {
        if (unico) throw new Error('Registro não encontrado: ' + id);
        return;
      }
      var obj = Object.assign({}, lista[i]);
      aplicarCampos(colunas, obj, mudancas[id], unico);
      var valores = linhaDe(colunas, obj);
      if (linha) _gravacoes["'" + nome + "'!A" + linha + ':' + letraDaColuna(colunas.length) + linha] = valores;
      else pendentes.linhas[novo] = valores;
      // Objeto novo: quem guardou o registro antigo continua vendo o antigo, como numa leitura nova.
      lista[i] = registroDeValores(colunas, valores);
      gravados.push(lista[i]);
    });
    delete _indicesTabelas[nome];
    return gravados;
  });
}

function aplicarCampos(colunas, obj, campos, marcarAtualizacao) {
  Object.keys(campos).forEach(function (col) {
    if (col !== 'id' && colunas.indexOf(col) !== -1) obj[col] = campos[col] === undefined || campos[col] === null ? '' : campos[col];
  });
  if (marcarAtualizacao && colunas.indexOf('atualizado_em') !== -1) obj.atualizado_em = agoraIso();
}

/** Como era antes da API: lê a aba, muda as linhas e grava a aba inteira de volta. */
function atualizarNaPlanilha(nome, mudancas, unico) {
  var colunas = TABELAS[nome];
  var aba = abaDaTabela(nome);
  var ultima = aba.getLastRow();
  var intervalo = ultima < 2 ? null : aba.getRange(2, 1, ultima - 1, colunas.length);
  var valores = intervalo ? intervalo.getValues() : [];
  var gravados = [];
  valores.forEach(function (linha) {
    var campos = mudancas[String(linha[0])];
    if (!campos) return;
    var obj = {};
    colunas.forEach(function (col, i) { obj[col] = linha[i]; });
    aplicarCampos(colunas, obj, campos, unico);
    colunas.forEach(function (col, i) { linha[i] = obj[col]; });
    gravados.push(obj);
  });
  if (unico && gravados.length < Object.keys(mudancas).length) {
    throw new Error('Registro não encontrado: ' + Object.keys(mudancas).join(', '));
  }
  if (gravados.length) {
    intervalo.setValues(valores);
    _pendenteNaPlanilha = true;
  }
  delete _cacheTabelas[nome];
  return gravados;
}

function excluir(nome, id) {
  return comTrava(function () {
    var linha = 0;
    if (gravarPelaApi()) {
      // As linhas abaixo sobem uma posição: o que estava para gravar (e as linhas novas) vai antes.
      enviarGravacoes();
      listar(nome);
      linha = _linhas[nome][String(id)] || 0;
    }
    var aba = abaDaTabela(nome);
    if (!linha) linha = numeroDaLinha(aba, id);
    if (!linha) throw new Error('Registro não encontrado: ' + id);
    aba.deleteRow(linha);
    // Exclui de fato agora: as próximas leituras e gravações pela API contam com as linhas já no lugar.
    SpreadsheetApp.flush();
    if (gravarPelaApi() && _cacheTabelas[nome]) {
      // Tira da memória e sobe uma posição as linhas que estavam abaixo, sem ler a aba de novo.
      _cacheTabelas[nome] = _cacheTabelas[nome].filter(function (r) { return String(r.id) !== String(id); });
      var posicao = _linhas[nome];
      delete posicao[String(id)];
      Object.keys(posicao).forEach(function (k) { if (posicao[k] > linha) posicao[k]--; });
    } else {
      delete _cacheTabelas[nome];
    }
    return true;
  });
}

/**
 * Envia pela API o que a operação gravou: as linhas alteradas numa chamada só e as linhas novas
 * numa chamada por aba. RAW: grava o texto como está, sem a planilha converter datas e números.
 */
function enviarGravacoes() {
  var intervalos = Object.keys(_gravacoes);
  var tabelas = Object.keys(_insercoes);
  if (!intervalos.length && !tabelas.length) return;
  var dados = intervalos.map(function (faixa) { return { range: faixa, values: [_gravacoes[faixa]] }; });
  var insercoes = _insercoes;
  _gravacoes = {};
  _insercoes = {};
  if (dados.length) {
    comEsperaDaCota_(function () {
      return Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'RAW', data: dados }, idDoBanco());
    });
  }
  tabelas.forEach(function (nome) {
    var pendentes = insercoes[nome];
    var r = comEsperaDaCota_(function () {
      return Sheets.Spreadsheets.Values.append({ values: pendentes.linhas }, idDoBanco(), "'" + nome + "'!A1",
        { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' });
    });
    // Ex.: 'ATENDIMENTOS'!A12:R14 — as linhas novas começam na 12.
    var inicio = /!A(\d+)/.exec(String(r && r.updates && r.updates.updatedRange));
    if (inicio && _cacheTabelas[nome] && _linhas[nome]) {
      pendentes.ids.forEach(function (id, i) { _linhas[nome][id] = Number(inicio[1]) + i; });
    } else {
      // Sem saber as linhas novas, a aba vai ser lida de novo.
      delete _cacheTabelas[nome];
    }
  });
}

/**
 * O Google limita as gravações por minuto de cada usuário. Se recusar por isso, espera e tenta de novo
 * (2, 4, 8, 16 e 32 segundos) em vez de perder a operação.
 */
function comEsperaDaCota_(fn) {
  for (var tentativa = 0; ; tentativa++) {
    try {
      return fn();
    } catch (e) {
      var cota = /quota|rate limit|429|too many requests/i.test(String(e && e.message));
      if (!cota || tentativa >= 5 || typeof Utilities.sleep !== 'function') throw e;
      Utilities.sleep(Math.pow(2, tentativa + 1) * 1000 + Math.floor(Math.random() * 500));
    }
  }
}

function numeroDaLinha(aba, id) {
  var ultima = aba.getLastRow();
  if (ultima < 2) return 0;
  var ids = aba.getRange(2, 1, ultima - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

function linhaDe(colunas, obj) {
  return colunas.map(function (col) {
    var v = obj[col];
    return v === undefined || v === null ? '' : v;
  });
}

/** O registro como ele volta numa leitura: as colunas da tabela, nesta ordem. */
function registroDeValores(colunas, valores) {
  var obj = {};
  colunas.forEach(function (col, i) { obj[col] = valores[i]; });
  return obj;
}

// A operação atual já está com a trava (uma trava só por operação, mesmo com várias gravações).
var _travaAtiva = false;

/**
 * Garante que duas pessoas não gravem ao mesmo tempo. A operação inteira roda com a trava:
 * o que ela lê já vem depois da trava (nada lido antes é reaproveitado), e o que ela grava
 * vai para a planilha antes de soltar a trava. Se a operação falhar, as linhas alteradas
 * que ainda não foram enviadas são descartadas.
 */
function comTrava(fn) {
  if (_travaAtiva) return fn();
  var trava = LockService.getScriptLock();
  trava.waitLock(20000);
  _travaAtiva = true;
  _cacheTabelas = {};
  _indicesTabelas = {};
  _gravacoes = {};
  _insercoes = {};
  try {
    var resultado = fn();
    enviarGravacoes();
    return resultado;
  } catch (e) {
    _gravacoes = {};
    _insercoes = {};
    throw e;
  } finally {
    _travaAtiva = false;
    if (_pendenteNaPlanilha) {
      SpreadsheetApp.flush();
      _pendenteNaPlanilha = false;
    }
    trava.releaseLock();
  }
}
