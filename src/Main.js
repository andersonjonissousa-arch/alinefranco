/** Ponto de entrada do aplicativo web e controle de acesso. */

function doGet() {
  // Na tela de consentimento, o Google deixa desmarcar permissões. Sem a de planilhas, nada funciona:
  // em vez do erro técnico, a página pede para autorizar de novo.
  var autorizar = enderecoParaAutorizar_();
  if (autorizar) {
    return HtmlService.createHtmlOutput(paginaDeAutorizacao_(autorizar))
      .setTitle(APP.nome)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
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
  var r = apiInicio(true);
  return JSON.stringify(r).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** Endereço para autorizar o sistema, quando falta alguma permissão para quem está acessando; senão, ''. */
function enderecoParaAutorizar_() {
  try {
    if (typeof ScriptApp === 'undefined') return '';
    var info = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    return info.getAuthorizationStatus() === ScriptApp.AuthorizationStatus.REQUIRED ? info.getAuthorizationUrl() : '';
  } catch (e) {
    return '';
  }
}

function paginaDeAutorizacao_(url) {
  var link = String(url).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'body{margin:0;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#D8ECFF;color:#1f2933}' +
    '.c{max-width:560px;margin:48px auto;padding:24px;background:#fff;border:1px solid #c9d8ea;border-radius:8px}' +
    'h1{font-size:20px;margin:0 0 12px}a.b{display:inline-block;margin-top:12px;padding:10px 16px;border-radius:6px;' +
    'background:#2f6f9f;color:#fff;text-decoration:none}li{margin:4px 0}</style></head><body><div class="c">' +
    '<h1>Gestão da Psicologia do HGWA: falta autorizar o acesso</h1>' +
    '<p>Sua conta Google ainda não deu ao sistema todas as permissões de que ele precisa para ler e gravar a planilha.</p>' +
    '<ol><li>Clique no botão abaixo.</li><li>Escolha a conta cadastrada no sistema.</li>' +
    '<li>Na tela do Google, marque <strong>todas</strong> as opções (ou "Selecionar tudo") e clique em <strong>Continuar</strong>.</li>' +
    '<li>Depois, abra o link do sistema de novo.</li></ol>' +
    '<a class="b" href="' + link + '" target="_top">Autorizar o acesso</a></div></body></html>';
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
    return { ok: false, erro: mensagemDeErro_(e) };
  }
}

/**
 * Envio repetido pela fila da tela (a internet caiu depois de gravar e o mesmo envio saiu de novo):
 * id_envio vira o id do registro novo. Devolve o registro já gravado com esse id, ou null.
 */
function jaGravadoPeloEnvio_(tabela, idEnvio) {
  idEnvio = String(idEnvio || '').trim();
  if (!idEnvio) return null;
  if (!/^[a-z0-9]{8,40}$/i.test(idEnvio)) throw new Error('Identificação do envio inválida.');
  return buscarPorId(tabela, idEnvio);
}

/** Erros de permissão do Google viram o que a pessoa precisa pedir; os demais seguem como vieram. */
function mensagemDeErro_(e) {
  var msg = (e && e.message) || String(e);
  if (/caller does not have permission|PERMISSION_DENIED|does not have permission to access|não tem permissão para acessar/i.test(msg)) {
    var email = '';
    try { email = String(Session.getActiveUser().getEmail() || ''); } catch (x) { email = ''; }
    return 'Sua conta' + (email ? ' (' + email + ')' : '') + ' não tem permissão para gravar na planilha do banco. ' +
      'Peça à coordenação para compartilhar a planilha com você como "Editor" (no Google Planilhas: Compartilhar > ' +
      'escolher a pessoa > Editor). Depois, atualize a página.';
  }
  return msg;
}

/** Para as funções que gravam: a operação inteira roda com a trava (ver comTrava, em Db.js). */
function responderGravando(fn) {
  return responder(function () { return comTrava(fn); });
}
