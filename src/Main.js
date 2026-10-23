/** Ponto de entrada do aplicativo web e controle de acesso. */

function doGet() {
  var pagina = HtmlService.createTemplateFromFile('ui/Index');
  // Os dados da primeira tela já vão junto com a página: o navegador não precisa pedir de novo.
  pagina.dadosIniciais = dadosIniciaisDaPagina();
  return pagina.evaluate()
    .setTitle(APP.nome)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * O que a tela precisa para abrir (usuário, cadastros e o painel do Início), como JSON seguro para
 * ficar dentro de um <script>. Sem acesso, leva o erro, e a tela mostra a mensagem.
 */
function dadosIniciaisDaPagina() {
  var r = responder(function () {
    var dados = apiInicio();
    if (!dados.ok) throw new Error(dados.erro);
    var gestao = apiGestao({});
    return Object.assign(dados.dados, { gestao: gestao.ok ? gestao.dados : null });
  });
  return JSON.stringify(r).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** Usado nos templates HTML: <?!= incluir('ui/Estilo') ?> */
function incluir(arquivo) {
  return HtmlService.createHtmlOutputFromFile(arquivo).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Psicologia')
    .addItem('Configurar banco', 'configurar')
    .addToUi();
}

/** Profissional ativo ligado ao e-mail de quem está acessando. Lança erro se não tiver acesso. */
function usuarioAtual() {
  var email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('Não foi possível identificar seu e-mail Google. Entre com a conta cadastrada.');
  var prof = listar('PROFISSIONAIS').filter(function (p) {
    return String(p.email).toLowerCase() === email && p.ativo === 'SIM';
  })[0];
  if (!prof) throw new Error('O e-mail ' + email + ' não tem acesso. Peça à coordenação para cadastrá-lo.');
  return prof;
}

function exigirCoordenacao() {
  var u = usuarioAtual();
  if (u.perfil !== 'COORDENAÇÃO') throw new Error('Somente a coordenação pode fazer esta alteração.');
  return u;
}

// Ligado só pelo autoteste, que provoca erros de propósito.
var _semRegistroDeErros = false;

/**
 * Envolve cada chamada da tela: devolve { ok: true, dados } ou { ok: false, erro }.
 * Assim a tela sempre mostra uma mensagem clara em vez de um erro técnico.
 */
function responder(fn) {
  try {
    return { ok: true, dados: fn() };
  } catch (e) {
    if (!_semRegistroDeErros) console.error(e);
    return { ok: false, erro: e.message || String(e) };
  }
}

/** Para as funções que gravam: a operação inteira roda com a trava (ver comTrava, em Db.js). */
function responderGravando(fn) {
  return responder(function () { return comTrava(fn); });
}
