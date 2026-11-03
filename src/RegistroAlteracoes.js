/**
 * Consulta do registro de alterações (aba AUDITORIA): quem incluiu, alterou ou excluiu o quê, e quando.
 * Só a coordenação. A gravação fica em Db.js (auditar_), junto com cada operação.
 */
var ROTULO_TABELA_AUDITORIA = {
  PACIENTES: 'Paciente', ADMISSOES: 'Admissão', ATENDIMENTOS: 'Atendimento', INTERCONSULTAS: 'Interconsulta',
  TRANSFERENCIAS: 'Transferência', DESCRICOES_DEMANDA: 'Descrição da demanda', ATIVIDADES: 'Atividade assistencial',
  DESFECHOS_REGISTRADOS: 'Desfecho', REUNIOES: 'Reunião de equipe', GERENCIAIS: 'Atividade gerencial',
  PROFISSIONAIS: 'Cadastro: profissional', SETORES: 'Cadastro: setor', UNIDADES: 'Cadastro: unidade', LISTAS: 'Cadastro: lista',
  PRIORIDADES: 'Cadastro: prioridade', MOTIVOS_SOLICITACAO: 'Cadastro: motivo', JUSTIFICATIVAS: 'Cadastro: justificativa',
  FERIADOS: 'Cadastro: feriado', DESFECHOS: 'Cadastro: desfecho', PARAMETROS: 'Cadastro: parâmetro', TODAS: 'Limpeza dos dados de teste'
};

// Campos que ajudam a reconhecer o registro, nesta ordem; ids e carimbos ficam de fora.
var CAMPOS_RESUMO_AUDITORIA = ['nome', 'prontuario', 'data_admissao', 'data', 'hora', 'publico', 'quantidade', 'tipo_atendimento',
  'descricao', 'tipo', 'chave', 'valor', 'prazo', 'data_solicitacao', 'hora_solicitacao', 'data_desfecho', 'email', 'perfil', 'observacao', 'observacoes'];

function resumoDaAuditoria_(a, nomes) {
  var dados = {};
  try { dados = JSON.parse(a.dados || '{}'); } catch (e) { return String(a.dados || ''); }
  var valor = function (campo, v) {
    if (v === '' || v === undefined || v === null) return '—';
    if (/unidade_id$/.test(campo) && nomes.unidades[v]) return nomes.unidades[v];
    if (campo === 'justificativa_id' && nomes.justificativas[v]) return nomes.justificativas[v];
    if (campo === 'desfecho_id' && nomes.desfechos[v]) return nomes.desfechos[v];
    return String(v);
  };
  if (a.acao === 'ALTERAÇÃO') {
    return Object.keys(dados.depois || {}).map(function (c) {
      return c + ': ' + valor(c, (dados.antes || {})[c]) + ' → ' + valor(c, dados.depois[c]);
    }).join(' · ');
  }
  if (a.acao === 'LIMPEZA') {
    return Object.keys(dados.apagados || {}).map(function (t) { return t + ': ' + dados.apagados[t]; }).join(' · ') +
      (dados.copia ? ' · ' + dados.copia : '');
  }
  var partes = CAMPOS_RESUMO_AUDITORIA.filter(function (c) { return dados[c] !== undefined && dados[c] !== ''; })
    .slice(0, 6).map(function (c) { return c + ': ' + valor(c, dados[c]); });
  ['unidade_id', 'justificativa_id', 'desfecho_id'].forEach(function (c) {
    if (dados[c] && partes.length < 8) partes.push(c.replace(/_id$/, '') + ': ' + valor(c, dados[c]));
  });
  return partes.join(' · ');
}

/**
 * filtros: { desde, ate } ('AAAA-MM-DD'; padrão: últimos 30 dias). O resto (pessoa, tipo, busca) a tela filtra.
 * Devolve do mais recente para o mais antigo, até 1000 linhas.
 */
function apiHistoricoAlteracoes(filtros) {
  return responder(function () {
    exigirCoordenacao();
    var f = filtros || {};
    var ate = normalizarData(f.ate) || hoje();
    var desde = normalizarData(f.desde) || adicionarDias(ate, -30);
    if (desde > ate) throw new Error('A data inicial é depois da final.');
    var pacientes = mapaPorId('PACIENTES');
    var admissoes = mapaPorId('ADMISSOES');
    var profissionais = {};
    listar('PROFISSIONAIS').forEach(function (p) { profissionais[String(p.email).toLowerCase()] = p.nome; });
    var nomeDe = function (tabela) {
      var m = {};
      listar(tabela).forEach(function (x) { m[x.id] = x.nome; });
      return m;
    };
    var nomes = { unidades: nomeDe('UNIDADES'), justificativas: nomeDe('JUSTIFICATIVAS'), desfechos: nomeDe('DESFECHOS') };
    var todos = listar('AUDITORIA').filter(function (a) {
      var dia = String(a.quando).slice(0, 10);
      return dia >= desde && dia <= ate;
    }).sort(function (a, b) { return String(b.quando).localeCompare(String(a.quando)); });
    var itens = todos.slice(0, 1000).map(function (a) {
      var pacienteId = a.paciente_id || ((admissoes[a.admissao_id] || {}).paciente_id) || '';
      var paciente = pacientes[pacienteId] || {};
      var dados = {};
      try { dados = JSON.parse(a.dados || '{}'); } catch (e) { dados = {}; }
      // Paciente já excluído: o nome está no próprio registro da exclusão.
      if (!paciente.nome && a.tabela === 'PACIENTES') paciente = dados.depois || dados;
      return {
        quando: a.quando, email: a.email, profissional_nome: profissionais[String(a.email).toLowerCase()] || '',
        acao: a.acao, tabela: a.tabela, tabela_nome: ROTULO_TABELA_AUDITORIA[a.tabela] || a.tabela, registro_id: a.registro_id,
        admissao_id: a.admissao_id, paciente_nome: paciente.nome || '', prontuario: paciente.prontuario || '',
        resumo: resumoDaAuditoria_(a, nomes)
      };
    });
    return { desde: desde, ate: ate, total: todos.length, itens: itens };
  });
}
