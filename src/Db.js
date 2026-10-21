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

/** Todas as linhas da tabela, como objetos. Lê a aba uma vez por execução. */
function listar(nome) {
  if (_cacheTabelas[nome]) return _cacheTabelas[nome];
  var colunas = TABELAS[nome];
  var aba = abaDaTabela(nome);
  var ultima = aba.getLastRow();
  var linhas = ultima < 2 ? [] : aba.getRange(2, 1, ultima - 1, colunas.length).getValues();
  var registros = [];
  linhas.forEach(function (linha) {
    if (linha[0] === '') return;
    var obj = {};
    colunas.forEach(function (col, i) {
      obj[col] = linha[i] instanceof Date ? normalizarDataHora(col, linha[i]) : linha[i];
    });
    registros.push(obj);
  });
  _cacheTabelas[nome] = registros;
  return registros;
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
    trava.releaseLock();
  }
}
