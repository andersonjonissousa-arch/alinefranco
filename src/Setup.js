/**
 * Configuração inicial. Rode "configurar" uma vez pelo editor do Apps Script:
 * cria (ou completa) as abas do banco e preenche setores, unidades e listas.
 * Pode ser rodada de novo sem duplicar nada.
 */

function configurar() {
  return comTrava(configurarComTrava);
}

function configurarComTrava() {
  var banco = obterOuCriarBanco();
  Object.keys(TABELAS).forEach(function (nome) { prepararAba(banco, nome); });
  removerAbaPadrao(banco);
  // As abas novas precisam existir de fato antes da primeira leitura pela API.
  SpreadsheetApp.flush();
  semearSetoresEUnidades();
  semearListas();
  semearMatrizes();
  semearFeriados();
  semearDesfechos();
  semearParametros();
  converterPrazosSolicitacaoEmDias();
  semearCoordenacao();
  // Aplica as regras da versão atual aos prazos das admissões em andamento.
  recalcularAdmissoesAbertas();
  Logger.log('Banco pronto: ' + banco.getUrl());
  return banco.getUrl();
}

function obterOuCriarBanco() {
  if (_bancoTeste) return _bancoTeste;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(APP.propDbId);
  if (id) return SpreadsheetApp.openById(id);
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa) return ativa;
  var novo = SpreadsheetApp.create(APP.nome + ' — Banco de dados');
  props.setProperty(APP.propDbId, novo.getId());
  return novo;
}

function prepararAba(banco, nome) {
  var colunas = TABELAS[nome];
  var aba = banco.getSheetByName(nome) || banco.insertSheet(nome);
  var cabecalho = aba.getRange(1, 1, 1, colunas.length);
  var atual = cabecalho.getValues()[0];
  colunas.forEach(function (col, i) {
    if (atual[i] && atual[i] !== col) {
      throw new Error('A aba ' + nome + ' tem a coluna "' + atual[i] + '" onde deveria estar "' + col + '".');
    }
  });
  cabecalho.setValues([colunas]).setFontWeight('bold').setBackground('#e8eef7');
  aba.setFrozenRows(1);
  // Tudo como texto: evita que a planilha converta ids, prontuários e datas sozinha.
  aba.getRange(1, 1, aba.getMaxRows(), colunas.length).setNumberFormat('@');
  return aba;
}

function removerAbaPadrao(banco) {
  ['Página1', 'Sheet1'].forEach(function (nome) {
    var aba = banco.getSheetByName(nome);
    if (aba && banco.getSheets().length > 1 && aba.getLastRow() === 0) banco.deleteSheet(aba);
  });
}

function semearSetoresEUnidades() {
  var setores = listar('SETORES');
  var unidades = listar('UNIDADES');
  var ordemUnidade = unidades.length;
  SETORES_INICIAIS.forEach(function (s, i) {
    var setor = setores.filter(function (x) { return x.nome === s.nome; })[0] ||
      inserir('SETORES', { nome: s.nome, ordem: i + 1, ativo: 'SIM' });
    s.unidades.forEach(function (nomeUnidade) {
      var existe = listar('UNIDADES').some(function (u) { return u.nome === nomeUnidade; });
      if (!existe) inserir('UNIDADES', { nome: nomeUnidade, setor_id: setor.id, ordem: ++ordemUnidade, ativo: 'SIM' });
    });
  });
}

function semearListas() {
  Object.keys(LISTAS_INICIAIS).forEach(function (lista) {
    var existentes = listar('LISTAS').filter(function (x) { return x.lista === lista; });
    if (existentes.length) return;
    var linhas = LISTAS_INICIAIS[lista].map(function (valor, i) {
      return [novoId(), lista, valor, i + 1, 'SIM'];
    });
    var aba = abaDaTabela('LISTAS');
    aba.getRange(aba.getLastRow() + 1, 1, linhas.length, linhas[0].length).setValues(linhas);
    // Gravação direta na planilha: a próxima leitura pela API espera ela chegar (lerPelaApi, em Db.js).
    _pendenteNaPlanilha = true;
    delete _cacheTabelas.LISTAS;
  });
}

/** Prioridades das duas matrizes, e os motivos e justificativas ligados a elas. */
function semearMatrizes() {
  if (!listar('PRIORIDADES').length) {
    PRIORIDADES_INICIAIS.forEach(function (p, i) {
      inserir('PRIORIDADES', { tipo: p[0], nome: p[1], prazo: p[2], periodicidade: p[3], ordem: i + 1, ativo: 'SIM' });
    });
  }
  var idPrioridade = function (tipo, nome) {
    var p = listar('PRIORIDADES').filter(function (x) { return x.tipo === tipo && x.nome === nome; })[0];
    return p ? p.id : '';
  };
  if (!listar('MOTIVOS_SOLICITACAO').length) {
    MOTIVOS_SOLICITACAO_INICIAIS.forEach(function (m, i) {
      inserir('MOTIVOS_SOLICITACAO', { nome: m[0], prioridade_id: idPrioridade(TIPOS_PRIORIDADE.solicitacao, m[1]), ordem: i + 1, ativo: 'SIM' });
    });
  }
  if (!listar('JUSTIFICATIVAS').length) {
    JUSTIFICATIVAS_INICIAIS.forEach(function (j, i) {
      inserir('JUSTIFICATIVAS', { nome: j[0], prioridade_id: idPrioridade(TIPOS_PRIORIDADE.seguimento, j[1]), ordem: i + 1, ativo: 'SIM' });
    });
  }
  var justificativas = listar('JUSTIFICATIVAS');
  JUSTIFICATIVAS_GARANTIDAS.forEach(function (j) {
    var existe = justificativas.some(function (x) { return normalizarTexto(x.nome) === normalizarTexto(j[0]); });
    if (!existe) {
      inserir('JUSTIFICATIVAS', { nome: j[0], prioridade_id: idPrioridade(TIPOS_PRIORIDADE.seguimento, j[1]),
        ordem: justificativas.length + 1, ativo: 'SIM' });
    }
  });
}

function semearFeriados() {
  if (listar('FERIADOS').length) return;
  FERIADOS_NACIONAIS.forEach(function (f) { inserir('FERIADOS', { data: f[0], descricao: f[1] }); });
}

function semearDesfechos() {
  if (listar('DESFECHOS').length) return;
  DESFECHOS_INICIAIS.forEach(function (d, i) {
    inserir('DESFECHOS', { nome: d[0], encerra_admissao: d[1], ordem: i + 1, ativo: 'SIM' });
  });
}

/** Parâmetros que faltam são criados; os existentes não são alterados. */
/**
 * v27: o prazo da interconsulta passou de horas úteis (24/48/72) para dias úteis (1/2/3).
 * Converte uma única vez as prioridades da matriz de atendimento de bancos anteriores e marca o
 * parâmetro PRAZO_SOLICITACAO_EM_DIAS; prioridades já em dias (menos de 24) não mudam.
 */
function converterPrazosSolicitacaoEmDias() {
  if (parametro('PRAZO_SOLICITACAO_EM_DIAS', '') === 'SIM') return;
  listar('PRIORIDADES').filter(function (p) { return p.tipo === TIPOS_PRIORIDADE.solicitacao; }).forEach(function (p) {
    var n = Number(p.prazo);
    if (p.prazo === '' || isNaN(n) || n < 24) return;
    var dias = Math.ceil(n / 24);
    var campos = { prazo: String(dias) };
    if (/\dh/.test(String(p.periodicidade))) campos.periodicidade = 'Atender em até ' + dias + (dias === 1 ? ' dia útil' : ' dias úteis');
    atualizar('PRIORIDADES', p.id, campos);
  });
  inserir('PARAMETROS', { chave: 'PRAZO_SOLICITACAO_EM_DIAS', valor: 'SIM',
    descricao: 'O prazo das interconsultas está em dias úteis (v27). Não altere.' });
}

function semearParametros() {
  PARAMETROS_INICIAIS.forEach(function (p) {
    var existe = listar('PARAMETROS').some(function (x) { return x.chave === p[0]; });
    if (!existe) inserir('PARAMETROS', { chave: p[0], valor: p[1], descricao: p[2] });
  });
}

/** Quem roda a configuração vira coordenação, para conseguir entrar no sistema. */
function semearCoordenacao() {
  var email = Session.getActiveUser().getEmail();
  if (!email || listar('PROFISSIONAIS').length) return;
  inserir('PROFISSIONAIS', {
    nome: email.split('@')[0].toUpperCase(),
    email: email.toLowerCase(),
    categoria: CATEGORIA_EMPRESA,
    perfil: 'COORDENAÇÃO',
    ativo: 'SIM'
  });
}
