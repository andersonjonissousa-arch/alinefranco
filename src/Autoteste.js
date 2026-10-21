/**
 * Autoteste no Google de verdade. Rode "testarSistema" no editor do Apps Script.
 * Usa uma planilha de teste nova (não mexe no banco real), passa pelo fluxo inteiro
 * e mostra no registro de execução o que passou e o que falhou.
 * No fim, a planilha de teste e a exportação de teste podem ser apagadas do Drive.
 */
function testarSistema() {
  var resultados = [];
  var criadas = [];
  var verificar = function (condicao, descricao, detalhe) {
    resultados.push((condicao ? 'OK    ' : 'FALHOU') + '  ' + descricao + (condicao || !detalhe ? '' : ' — ' + detalhe));
  };
  var dados = function (resposta, descricao) {
    verificar(resposta && resposta.ok, descricao, resposta && resposta.erro);
    return resposta && resposta.ok ? resposta.dados : null;
  };

  var teste = SpreadsheetApp.create('TESTE AUTOMÁTICO — Gestão da Psicologia — pode apagar');
  criadas.push(teste.getUrl());
  _bancoTeste = teste;
  _cacheTabelas = {};
  // O teste provoca erros de propósito (ex.: prontuário repetido); não precisam aparecer no registro.
  _semRegistroDeErros = true;
  try {
    configurar();
    _cacheTabelas = {};
    verificar(Object.keys(TABELAS).every(function (t) { return teste.getSheetByName(t); }), 'Configuração: todas as abas criadas');
    verificar(listar('PRIORIDADES').length === PRIORIDADES_INICIAIS.length, 'Configuração: prioridades das matrizes');

    var inicio = dados(apiInicio(), 'Acesso: usuário reconhecido como coordenação');
    verificar(inicio && inicio.usuario.perfil === 'COORDENAÇÃO', 'Acesso: perfil de coordenação');

    var hojeIso = hoje();
    var horaAgora = agora().slice(11, 16);
    var paciente = dados(apiSalvarPaciente({ prontuario: '999000111', nome: 'Paciente Teste Automático' }), 'Paciente: cadastro');
    verificar(apiSalvarPaciente({ prontuario: '999000111', nome: 'Outro' }).ok === false, 'Paciente: bloqueio de prontuário duplicado');

    var unidade = listar('UNIDADES')[0];
    var motivo = listar('MOTIVOS_SOLICITACAO').filter(function (m) { return m.nome === 'RISCO DE SUICÍDIO'; })[0];
    var justificativa = listar('JUSTIFICATIVAS').filter(function (j) { return j.nome === 'POUCOS RECURSOS DE ENFRENTAMENTO'; })[0];
    var det = dados(apiSalvarAdmissao({
      paciente_id: paciente && paciente.id, unidade_id: unidade.id, data_admissao: hojeIso,
      tipo_solicitacao: 'EQUIPE', motivo_solicitacao_id: motivo.id, data_solicitacao: hojeIso, hora_solicitacao: '00:00',
      para_quem: 'PACIENTE', necessidade_acompanhamento: 'PACIENTE', justificativa_id: justificativa.id
    }), 'Admissão: registro com solicitação de prioridade alta');
    var adm = det && det.admissao;
    verificar(adm && adm.prioridade_solicitacao === 'ALTA', 'Admissão: prioridade da solicitação pela matriz', adm && adm.prioridade_solicitacao);
    verificar(adm && adm.status === STATUS_ADMISSAO.aguardando, 'Admissão: aguardando 1º atendimento', adm && adm.status);

    var daAdmissao = function (lista) { return lista && lista.itens.filter(function (i) { return i.id === adm.id; })[0]; };
    var item = daAdmissao(dados(apiGestao({ unidade_id: unidade.id }), 'Gestão: pacientes da unidade'));
    verificar(item && item.prazos.primeiro.estado === 'PENDENTE', 'Gestão: paciente aparece aguardando o 1º atendimento');
    item = daAdmissao(dados(apiInterconsultas({ situacao: 'PENDENTES' }), 'Gestão: interconsultas pendentes'));
    verificar(item && item.prazos.interconsulta.estado === 'PENDENTE', 'Gestão: interconsulta aparece aguardando resposta');

    det = dados(apiRegistrarAtendimento({ admissao_id: adm.id, data: hojeIso, hora: horaAgora, publico: 'PACIENTE' }), 'Atendimento: registro ao paciente');
    adm = det && det.admissao;
    verificar(adm && adm.primeiro_no_prazo === 'SIM', '1º atendimento dentro do prazo da admissão', adm && adm.primeiro_no_prazo);
    verificar(adm && adm.resposta_no_prazo === 'SIM', 'Resposta à solicitação dentro de 24h', adm && adm.resposta_no_prazo);
    verificar(adm && adm.proximo_prazo > hojeIso, 'Próximo retorno calculado', adm && adm.proximo_prazo);
    item = daAdmissao(dados(apiInterconsultas({ situacao: 'RESPONDIDAS' }), 'Gestão: interconsultas respondidas'));
    verificar(item && item.prazos.interconsulta.resultado === 'NO PRAZO', 'Gestão: interconsulta respondida no prazo');
    item = daAdmissao(dados(apiGestao({}), 'Gestão: prazos dos pacientes'));
    verificar(item && item.prazos.retorno.estado === 'PENDENTE' && item.prazos.retorno.prazo === adm.proximo_prazo,
      'Gestão: próximo retorno pela matriz de seguimento');

    det = dados(apiRegistrarAtendimento({
      admissao_id: adm.id, data: hojeIso, hora: horaAgora, publico: 'FAMÍLIA', quantidade: 2, paciente_impossibilitado: 'NÃO'
    }), 'Atendimento: registro à família (2 pessoas)');
    verificar(det && det.atendimentos.some(function (a) { return a.publico === 'FAMÍLIA' && a.conta_prazo === 'NÃO'; }),
      'Atendimento à família sem paciente impossibilitado não conta para o prazo');

    dados(apiRegistrarAtividade({ admissao_id: adm.id, data: hojeIso, tipo: 'DISCUSSÃO DE CASO', quantidade: 1 }), 'Atividade assistencial: registro');

    var desfecho = function (nome) { return listar('DESFECHOS').filter(function (d) { return d.nome === nome; })[0].id; };
    var base = {
      id: adm.id, paciente_id: paciente.id, unidade_id: unidade.id, data_admissao: hojeIso, tipo_solicitacao: 'EQUIPE',
      motivo_solicitacao_id: motivo.id, data_solicitacao: hojeIso, hora_solicitacao: '00:00', para_quem: 'PACIENTE',
      necessidade_acompanhamento: 'PACIENTE', justificativa_id: justificativa.id
    };
    det = dados(apiSalvarAdmissao(Object.assign({ desfecho_id: desfecho('ALTA PSICOLÓGICA'), data_desfecho: hojeIso }, base)), 'Desfecho psicológico: registro');
    verificar(det && det.admissao.status === STATUS_ADMISSAO.acompanhamentoEncerrado, 'Desfecho psicológico mantém a admissão aberta');
    det = dados(apiRetomarAcompanhamento({ id: adm.id, data: hojeIso }), 'Retomada do acompanhamento');
    det = dados(apiSalvarAdmissao(Object.assign({ desfecho_id: desfecho('ALTA'), data_desfecho: hojeIso }, base)), 'Saída do hospital: registro');
    verificar(det && det.admissao.status === STATUS_ADMISSAO.encerrada, 'Saída do hospital encerra a admissão');
    verificar(det && det.desfechos.length === 2, 'Histórico guarda os dois desfechos', det && det.desfechos.length);

    dados(apiRegistrarReuniao({ data: hojeIso, unidade_id: unidade.id, tipo: 'GRUPO', quantidade: 1 }), 'Registro do dia: reunião de equipe');
    dados(apiRegistrarGerencial({ data: hojeIso, tipo: 'TREINAMENTO', quantidade: 1 }), 'Registro do dia: atividade gerencial');

    var c = dados(apiCompilado({ ano: hojeIso.slice(0, 4), mes: String(Number(hojeIso.slice(5, 7))), eixo: 'UNIDADE', grupo: 'TODOS' }), 'Compilado mensal');
    var linha = function (secao, rotulo) {
      var s = c && c.secoes.filter(function (x) { return x.titulo.indexOf(secao) === 0; })[0];
      return s && s.linhas.filter(function (l) { return l.rotulo.indexOf(rotulo) === 0; })[0];
    };
    verificar(linha('Atendimentos', 'TOTAL DE PESSOAS') && linha('Atendimentos', 'TOTAL DE PESSOAS').total === 3, 'Compilado: 3 pessoas atendidas');
    verificar(linha('Desfechos', 'TOTAL') && linha('Desfechos', 'TOTAL').total === 2, 'Compilado: 2 desfechos');
    verificar(linha('Resposta à solicitação', '% NO PRAZO') && linha('Resposta à solicitação', '% NO PRAZO').total === 1, 'Compilado: resposta à solicitação 100% no prazo');
    dados(apiCompilado({ ano: hojeIso.slice(0, 4), eixo: 'MES', grupo: 'EMPRESA' }), 'Compilado anual (empresa)');

    var exp = dados(apiExportarCompilado({ ano: hojeIso.slice(0, 4), mes: String(Number(hojeIso.slice(5, 7))), eixo: 'UNIDADE' }), 'Exportação para Google Planilhas');
    if (exp) criadas.push(exp.url);

    try {
      var html = HtmlService.createTemplateFromFile('ui/Index').evaluate().getContent();
      verificar(html.indexOf('Gestão da Psicologia') !== -1 && html.indexOf('telaAdmissoes') !== -1, 'Tela: arquivos ui/Index, ui/Estilo e ui/App encontrados');
    } catch (e) {
      verificar(false, 'Tela: arquivos ui/Index, ui/Estilo e ui/App encontrados', e.message);
    }
  } catch (e) {
    verificar(false, 'Execução interrompida', e.message);
  } finally {
    _semRegistroDeErros = false;
    _bancoTeste = null;
    _cacheTabelas = {};
  }

  var falhas = resultados.filter(function (r) { return r.indexOf('FALHOU') === 0; }).length;
  var resumo = [
    falhas ? 'RESULTADO: ' + falhas + ' FALHA(S) — copie este registro e envie para correção.' : 'RESULTADO: TUDO OK (' + resultados.length + ' verificações).',
    ''
  ].concat(resultados).concat(['', 'Planilhas de teste criadas (pode apagar do Drive):']).concat(criadas);
  Logger.log(resumo.join('\n'));
  return resumo.join('\n');
}
