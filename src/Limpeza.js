/**
 * Limpeza dos dados de teste antes do uso real. Rode "limparDadosDeTeste" no editor do Apps Script,
 * com a conta da coordenação.
 * Apaga pacientes, admissões, atendimentos, interconsultas e os outros registros do dia a dia.
 * Mantém tudo o que é configuração: setores, unidades, profissionais, listas, prioridades, motivos,
 * justificativas, feriados, desfechos (o cadastro) e parâmetros.
 * Antes de apagar, faz uma cópia da planilha inteira no Drive de quem rodou, para poder voltar atrás.
 */
var TABELAS_DE_REGISTROS = ['PACIENTES', 'ADMISSOES', 'TRANSFERENCIAS', 'INTERCONSULTAS', 'DESCRICOES_DEMANDA',
  'ATENDIMENTOS', 'ATIVIDADES', 'DESFECHOS_REGISTRADOS', 'REUNIOES', 'GERENCIAIS'];

function limparDadosDeTeste() {
  var usuario = exigirCoordenacao();
  var banco = abrirBanco();
  var linhas = [];
  var apagados = {};
  comTrava(function () {
    var copia = banco.copy('CÓPIA ANTES DA LIMPEZA ' + agora() + ' — ' + banco.getName());
    linhas.push('Cópia de segurança (pode apagar depois que conferir): ' + copia.getUrl());
    linhas.push('');
    linhas.push('Apagados:');
    TABELAS_DE_REGISTROS.forEach(function (nome) {
      var aba = banco.getSheetByName(nome);
      var ultima = aba ? aba.getLastRow() : 0;
      if (ultima < 2) { linhas.push('  ' + nome + ': 0'); return; }
      // A planilha não deixa apagar todas as linhas abaixo do cabeçalho fixo: sobra uma linha vazia no fim.
      if (ultima >= aba.getMaxRows()) aba.insertRowsAfter(ultima, 1);
      aba.deleteRows(2, ultima - 1);
      apagados[nome] = ultima - 1;
      linhas.push('  ' + nome + ': ' + (ultima - 1));
    });
    SpreadsheetApp.flush();
    // A limpeza fica no registro de alterações, com a cópia de segurança e quantas linhas saíram de cada aba.
    auditar_('LIMPEZA', 'TODAS', {}, { copia: linhas[0], apagados: apagados });
  });
  _cacheTabelas = {};
  _indicesTabelas = {};
  linhas.push('');
  linhas.push('Mantidos: ' + Object.keys(TABELAS).filter(function (t) { return TABELAS_DE_REGISTROS.indexOf(t) === -1; })
    .map(function (t) { return t + ' (' + listar(t).length + ')'; }).join(', '));
  var resumo = ['LIMPEZA DOS DADOS DE TESTE — feita por ' + usuario.nome + ' em ' + agora(), ''].concat(linhas).join('\n');
  Logger.log(resumo);
  return resumo;
}
