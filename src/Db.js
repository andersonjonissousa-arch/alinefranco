/**
 * Acesso às abas do banco como tabelas. Cada linha vira um objeto
 * cujas chaves são os nomes das colunas definidos em TABELAS.
 */

var _cacheTabelas = {};

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
// Usado só pela medição de desempenho, para comparar com a leitura aba por aba.
var _forcarLeituraPorAba = false;
// Se a API falhar uma vez, o resto da execução lê aba por aba sem tentar de novo.
var _apiIndisponivel = false;

/**
 * Lê numa consulta só, pela API do Google Planilhas, todas as tabelas que ainda não estão no cache.
 * Cada consulta ao Google custa um tempo fixo, então ler tudo junto é bem mais rápido que aba por aba.
 * Se a API não estiver disponível, lê só a tabela pedida, aba por aba.
 */
function carregarTabelas(pedida) {
  if (!TABELAS[pedida]) throw new Error('Tabela desconhecida: ' + pedida);
  if (!_forcarLeituraPorAba && !_apiIndisponivel && typeof Sheets !== 'undefined') {
    var nomes = Object.keys(TABELAS).filter(function (n) { return !_cacheTabelas[n]; });
    try {
      var resposta = Sheets.Spreadsheets.Values.batchGet(idDoBanco(), {
        ranges: nomes.map(intervaloDaTabela),
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'SERIAL_NUMBER'
      });
      var faixas = resposta.valueRanges || [];
      nomes.forEach(function (nome, i) {
        _cacheTabelas[nome] = registrosDe(nome, (faixas[i] && faixas[i].values) || []);
      });
      _modoLeitura = 'API';
      return;
    } catch (e) {
      _apiIndisponivel = true;
      if (!_semRegistroDeErros) console.warn('Leitura pela API do Google Planilhas falhou; lendo aba por aba. ' + e.message);
    }
  }
  var aba = abaDaTabela(pedida);
  var ultima = aba.getLastRow();
  _cacheTabelas[pedida] = registrosDe(pedida, ultima < 2 ? [] : aba.getRange(2, 1, ultima - 1, TABELAS[pedida].length).getValues());
  _modoLeitura = 'ABAS';
}

var _idBanco = '';

function idDoBanco() {
  if (_bancoTeste) return _bancoTeste.getId();
  if (!_idBanco) _idBanco = PropertiesService.getScriptProperties().getProperty(APP.propDbId) || abrirBanco().getId();
  return _idBanco;
}

/** Ex.: 'ATENDIMENTOS'!A2:R — da segunda linha até o fim, só as colunas da tabela. */
function intervaloDaTabela(nome) {
  return "'" + nome + "'!A2:" + letraDaColuna(TABELAS[nome].length);
}

function letraDaColuna(n) {
  var letras = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) letras = String.fromCharCode(65 + (n - 1) % 26) + letras;
  return letras;
}

// Colunas de data e hora. Se a planilha converteu o texto em data, a API devolve o número de série.
var COLUNA_DE_DATA = /^(data(_.*)?|prazo_(primeiro_atendimento|limite|resposta)|primeiro_atendimento|ultimo_contato|proximo_prazo|retomado_em|momento_resposta|hora(_.*)?|.*_em)$/;

/** Linhas da aba (sem o cabeçalho) viram objetos. A API omite as células vazias do fim; aqui voltam como ''. */
function registrosDe(nome, linhas) {
  var colunas = TABELAS[nome];
  var registros = [];
  linhas.forEach(function (linha) {
    if (linha[0] === '' || linha[0] === undefined) return;
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
  var lista = listar(nome);
  for (var i = 0; i < lista.length; i++) {
    if (String(lista[i].id) === String(id)) return lista[i];
  }
  return null;
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

/** Insere o registro (gera id se faltar) e devolve o registro gravado. */
function inserir(nome, registro) {
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var obj = Object.assign({}, registro);
    if (!obj.id) obj.id = novoId();
    if (colunas.indexOf('criado_em') !== -1 && !obj.criado_em) obj.criado_em = agoraIso();
    abaDaTabela(nome).appendRow(linhaDe(colunas, obj));
    delete _cacheTabelas[nome];
    return obj;
  });
}

/** Atualiza só os campos enviados do registro com esse id. */
function atualizar(nome, id, campos) {
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var aba = abaDaTabela(nome);
    var linha = numeroDaLinha(aba, id);
    if (!linha) throw new Error('Registro não encontrado: ' + id);
    var atual = aba.getRange(linha, 1, 1, colunas.length).getValues()[0];
    var obj = {};
    colunas.forEach(function (col, i) { obj[col] = atual[i]; });
    Object.keys(campos).forEach(function (col) {
      if (col !== 'id' && colunas.indexOf(col) !== -1) obj[col] = campos[col];
    });
    if (colunas.indexOf('atualizado_em') !== -1) obj.atualizado_em = agoraIso();
    aba.getRange(linha, 1, 1, colunas.length).setValues([linhaDe(colunas, obj)]);
    delete _cacheTabelas[nome];
    return obj;
  });
}

/** Atualiza vários registros de uma vez: { id: { campo: valor } }. Lê e grava a aba uma vez só. */
function atualizarVarios(nome, mudancas) {
  var ids = Object.keys(mudancas);
  if (!ids.length) return 0;
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var aba = abaDaTabela(nome);
    var ultima = aba.getLastRow();
    if (ultima < 2) return 0;
    var intervalo = aba.getRange(2, 1, ultima - 1, colunas.length);
    var valores = intervalo.getValues();
    var alteradas = 0;
    valores.forEach(function (linha) {
      var campos = mudancas[String(linha[0])];
      if (!campos) return;
      Object.keys(campos).forEach(function (col) {
        var i = colunas.indexOf(col);
        if (i > 0) linha[i] = campos[col] === undefined || campos[col] === null ? '' : campos[col];
      });
      alteradas++;
    });
    if (alteradas) intervalo.setValues(valores);
    delete _cacheTabelas[nome];
    return alteradas;
  });
}

function excluir(nome, id) {
  return comTrava(function () {
    var aba = abaDaTabela(nome);
    var linha = numeroDaLinha(aba, id);
    if (!linha) throw new Error('Registro não encontrado: ' + id);
    aba.deleteRow(linha);
    delete _cacheTabelas[nome];
    return true;
  });
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

/** Garante que duas pessoas não gravem na mesma aba ao mesmo tempo. */
function comTrava(fn) {
  var trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    return fn();
  } finally {
    // Grava de fato antes de soltar a trava: a próxima leitura (pela API) já vê o que foi gravado.
    SpreadsheetApp.flush();
    trava.releaseLock();
  }
}
