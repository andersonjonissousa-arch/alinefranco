/**
 * Medição de desempenho. Rode "medirDesempenho" no editor do Apps Script.
 * Mede o tempo de cada ação da tela duas vezes: lendo e gravando a planilha aba por aba (como era antes)
 * e pela API do Google Planilhas, com uma leitura e uma gravação por operação (como é agora).
 * As leituras usam o banco real, sem alterar nada. As gravações usam uma planilha de teste nova,
 * que pode ser apagada do Drive no fim.
 */
function medirDesempenho() {
  var vezes = 3;
  var linhas = [];
  var criadas = [];
  var apiFalhou = false;
  var novaExecucao = function () {
    _cacheTabelas = {};
    _banco = null;
    _idBanco = '';
    _apiIndisponivel = false;
  };
  var medir = function (fn) {
    var total = 0;
    var erro = '';
    for (var i = 0; i < vezes; i++) {
      novaExecucao();
      var inicio = Date.now();
      var r = fn();
      total += Date.now() - inicio;
      if (r && r.ok === false) erro = r.erro;
    }
    return { ms: total / vezes, erro: erro };
  };
  var segundos = function (ms) { return (ms / 1000).toFixed(1).replace('.', ',') + ' s'; };
  var comparar = function (rotulo, fn) {
    _forcarLeituraPorAba = true;
    var antes = medir(fn);
    _forcarLeituraPorAba = false;
    var depois = medir(fn);
    if (_modoLeitura !== 'API') apiFalhou = true;
    var ganho = antes.ms ? Math.round((1 - depois.ms / antes.ms) * 100) : 0;
    linhas.push((rotulo + '                                  ').slice(0, 34) +
      ('      ' + segundos(antes.ms)).slice(-8) + ('      ' + segundos(depois.ms)).slice(-10) +
      ('      ' + ganho + '%').slice(-9) + (antes.erro || depois.erro ? '   erro: ' + (depois.erro || antes.erro) : ''));
  };

  _semRegistroDeErros = true;
  try {
    linhas.push('Leituras no banco real (nada é alterado)');
    linhas.push('Ação                                 antes     agora   ganho');
    var hojeIso = hoje();
    var aberta = listar('ADMISSOES').filter(function (a) { return a.status !== STATUS_ADMISSAO.encerrada; })[0];
    comparar('Abrir o sistema', function () { return apiInicio(); });
    comparar('Início e Gestão', function () { return apiGestao({}); });
    comparar('Interconsultas', function () { return apiInterconsultas({ situacao: 'TODAS' }); });
    comparar('Lista de admissões', function () { return apiListarAdmissoes({ abertas: 'SIM' }); });
    if (aberta) comparar('Abrir um paciente', function () { return apiObterAdmissao(aberta.id); });
    comparar('Buscar paciente', function () { return apiBuscarPacientes('A'); });
    comparar('Compilado do mês', function () {
      return apiCompilado({ ano: hojeIso.slice(0, 4), mes: String(Number(hojeIso.slice(5, 7))), eixo: 'UNIDADE', grupo: 'TODOS' });
    });

    linhas.push('');
    linhas.push('Gravações numa planilha de teste');
    var teste = SpreadsheetApp.create('TESTE DE DESEMPENHO — Gestão da Psicologia — pode apagar');
    criadas.push(teste.getUrl());
    _bancoTeste = teste;
    novaExecucao();
    configurar();
    novaExecucao();
    var paciente = apiSalvarPaciente({ prontuario: '999000222', nome: 'Paciente Teste de Desempenho' }).dados;
    var base = {
      paciente_id: paciente.id, unidade_id: listar('UNIDADES')[0].id, data_admissao: adicionarDias(hojeIso, -7),
      necessidade_acompanhamento: 'PACIENTE', justificativa_id: listar('JUSTIFICATIVAS')[0].id
    };
    novaExecucao();
    var adm = apiSalvarAdmissao(base).dados.admissao;
    var n = 0;
    comparar('Registrar atendimento', function () {
      n++;
      return apiRegistrarAtendimento({ admissao_id: adm.id, data: adicionarDias(hojeIso, -1), hora: '08:' + (n < 10 ? '0' : '') + n, publico: 'PACIENTE' });
    });
    comparar('Salvar admissão', function () {
      n++;
      return apiSalvarAdmissao(Object.assign({ id: adm.id, observacoes: 'Medição ' + n }, base));
    });
    comparar('Cadastrar paciente', function () {
      n++;
      return apiSalvarPaciente({ prontuario: '999000' + (300 + n), nome: 'Paciente Teste ' + n });
    });
  } catch (e) {
    linhas.push('Medição interrompida: ' + e.message);
  } finally {
    _semRegistroDeErros = false;
    _forcarLeituraPorAba = false;
    _bancoTeste = null;
    novaExecucao();
  }

  var resumo = [
    'MEDIÇÃO DE DESEMPENHO (média de ' + vezes + ' vezes, tempo no servidor)',
    'antes = lendo e gravando aba por aba · agora = pela API, uma leitura e uma gravação por operação',
    'Na tela, cada clique soma cerca de 0,5 a 1,5 s de ida e volta do navegador.',
    ''
  ];
  if (apiFalhou) resumo.splice(3, 0, 'ATENÇÃO: a API do Google Planilhas não respondeu, e o sistema leu aba por aba. Envie este registro para correção.');
  resumo = resumo.concat(linhas).concat(criadas.length ? ['', 'Planilha de teste criada (pode apagar do Drive):'].concat(criadas) : []);
  Logger.log(resumo.join('\n'));
  return resumo.join('\n');
}
