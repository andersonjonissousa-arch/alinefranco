// Arquivo gerado por scripts/empacotar.js a partir de src/. Não edite aqui: edite src/ e gere de novo.

// ===== Config.js =====
/**
 * Configuração central do sistema: tabelas do banco (abas da planilha)
 * e valores iniciais (editáveis depois pela coordenação na tela de cadastros).
 */

var APP = {
  nome: 'Gestão da Psicologia',
  propDbId: 'DB_ID',
  fusoHorario: 'America/Fortaleza',
  inicioIndicadorPrimeiro: '2026-11-03'
};

/**
 * Cada tabela vira uma aba no banco. A primeira coluna é sempre o id.
 * A ordem das colunas é a ordem do cabeçalho na aba.
 */
var TABELAS = {
  SETORES: ['id', 'nome', 'ordem', 'ativo'],
  UNIDADES: ['id', 'nome', 'setor_id', 'ordem', 'ativo'],
  PROFISSIONAIS: ['id', 'nome', 'email', 'categoria', 'perfil', 'ativo'],
  LISTAS: ['id', 'lista', 'valor', 'ordem', 'ativo'],
  // Prioridades das duas matrizes, cada uma com seu prazo:
  // tipo SOLICITAÇÃO → prazo em dias úteis para responder à solicitação (v27; antes, horas úteis);
  // tipo SEGUIMENTO → prazo em dias úteis entre um atendimento e o próximo.
  PRIORIDADES: ['id', 'tipo', 'nome', 'prazo', 'periodicidade', 'ordem', 'ativo'],
  // Motivos da solicitação (matriz de atendimento). Sem prioridade = sem prazo de resposta.
  MOTIVOS_SOLICITACAO: ['id', 'nome', 'prioridade_id', 'ordem', 'ativo'],
  // Justificativas de acompanhamento (matriz de seguimento). Sem prioridade = sem prazo de retorno.
  JUSTIFICATIVAS: ['id', 'nome', 'prioridade_id', 'ordem', 'ativo'],
  // Feriados não contam como dia útil no cálculo dos prazos.
  FERIADOS: ['id', 'data', 'descricao'],
  // Desfechos e se cada um encerra a admissão (saída do hospital) ou só o acompanhamento psicológico.
  DESFECHOS: ['id', 'nome', 'encerra_admissao', 'ordem', 'ativo'],
  // Histórico: cada desfecho registrado numa admissão, inclusive os que foram seguidos de retomada.
  // vigente = SIM é o desfecho atual da admissão; vira NÃO quando o acompanhamento é retomado.
  DESFECHOS_REGISTRADOS: [
    'id', 'admissao_id', 'unidade_id', 'desfecho_id', 'data', 'encerra_admissao', 'vigente',
    'criado_por', 'criado_em', 'atualizado_em'
  ],
  // Parâmetros do sistema, como o prazo do 1º atendimento após a admissão e os tipos de solicitação com prazo.
  PARAMETROS: ['id', 'chave', 'valor', 'descricao'],
  PACIENTES: ['id', 'prontuario', 'nome', 'criado_em', 'atualizado_em', 'sexo', 'data_nascimento'],
  // Cada entrada do paciente no hospital. Uma nova admissão só depois que a anterior foi encerrada.
  ADMISSOES: [
    'id', 'paciente_id', 'data_admissao', 'unidade_id',
    // Solicitação antiga: colunas preservadas para compatibilidade; novos registros em INTERCONSULTAS.
    'tipo_solicitacao', 'motivo_solicitacao_id', 'data_solicitacao', 'hora_solicitacao',
    'para_quem', 'familiar_nome', 'familiar_parentesco',
    // Avaliação (o 1º atendimento)
    'descricao_demanda',
    // Acompanhamento e desfecho
    'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'retomado_em', 'observacoes',
    // Calculados pelo sistema ao salvar
    'status', 'prazo_primeiro_atendimento', 'primeiro_atendimento', 'primeiro_no_prazo',
    'dias_ate_primeiro_atendimento', 'ultimo_contato', 'proximo_prazo', 'prioridade_demanda',
    // Resposta à solicitação, em dias úteis, pela prioridade do motivo
    'prioridade_solicitacao', 'prazo_resposta', 'momento_resposta', 'horas_resposta', 'resposta_no_prazo',
    'criado_por', 'criado_em', 'atualizado_em'
  ],
  // Transferências internas: a unidade da admissão é preservada; a última transferência define a localização atual.
  TRANSFERENCIAS: ['id', 'admissao_id', 'origem_unidade_id', 'destino_unidade_id', 'data', 'hora', 'criado_por', 'criado_em'],
  // Solicitações independentes: várias por internação, com prazo próprio e resposta vinculada.
  INTERCONSULTAS: [
    'id', 'admissao_id', 'unidade_id', 'tipo_solicitacao', 'motivo_solicitacao_id',
    'data_solicitacao', 'hora_solicitacao', 'para_quem', 'familiar_nome', 'familiar_parentesco',
    'prioridade_solicitacao', 'prazo_horas', 'tem_prazo', 'atendimento_id', 'origem', 'observacoes',
    'criado_por', 'criado_em', 'excluido_em', 'excluido_por',
    // v27: prazo em dias úteis. prazo_horas fica só nas solicitações gravadas antes.
    'prazo_dias_uteis'
  ],
  // Descrição da demanda ao longo da internação: a do 1º atendimento (AVALIAÇÃO) e cada mudança, registrada
  // na tela da internação (MUDANÇA) ou na transferência (TRANSFERÊNCIA). "Editar" corrige a descrição atual.
  // A admissão guarda a descrição atual em descricao_demanda. No compilado, cada registro conta no mês e na unidade dele.
  DESCRICOES_DEMANDA: [
    'id', 'admissao_id', 'unidade_id', 'data', 'hora', 'descricao', 'origem', 'atendimento_id', 'transferencia_id',
    'profissional_id', 'criado_por', 'criado_em', 'atualizado_em', 'excluido_em', 'excluido_por'
  ],
  // Cada atendimento: ao paciente, à família ou aos dois (quantidade = nº de familiares), por quem, em que unidade e se foi no prazo.
  // tipo_prazo: PRIMEIRO (1º atendimento da admissão) ou RETORNO.
  // Todo atendimento conta para os prazos (v27). paciente_impossibilitado fica só nos registros antigos.
  ATENDIMENTOS: [
    'id', 'admissao_id', 'unidade_id', 'data', 'hora', 'publico', 'quantidade', 'paciente_impossibilitado', 'conta_prazo',
    'profissional_id', 'categoria', 'justificativa_id', 'tipo_prazo', 'prazo_limite', 'no_prazo', 'observacao',
    'criado_por', 'criado_em', 'tipo_atendimento'
  ],
  // Atividades assistenciais da admissão (ficha de admissão, discussão de caso, visitas...).
  ATIVIDADES: ['id', 'admissao_id', 'unidade_id', 'data', 'tipo', 'quantidade', 'profissional_id', 'categoria', 'criado_por', 'criado_em'],
  // Reuniões de equipe por unidade.
  REUNIOES: ['id', 'data', 'unidade_id', 'tipo', 'quantidade', 'profissional_id', 'categoria', 'criado_por', 'criado_em'],
  // Atividades gerenciais do serviço.
  GERENCIAIS: ['id', 'data', 'tipo', 'quantidade', 'profissional_id', 'categoria', 'criado_por', 'criado_em']
};

/** Só a primeira categoria entra nos números da empresa; residentes e estagiários aparecem à parte. */
var CATEGORIAS_PROFISSIONAL = ['PROFISSIONAL DA EMPRESA', 'RESIDENTE', 'ESTAGIÁRIO'];
var CATEGORIA_EMPRESA = 'PROFISSIONAL DA EMPRESA';
var PERFIS = ['COORDENAÇÃO', 'PROFISSIONAL'];
// Tipo da solicitação do atendimento. Só INTERCONSULTA responde a uma interconsulta registrada; EQUIPE é o pedido
// da equipe sem interconsulta vinculada (incluído a pedido da coordenação, ao lado de INTERCONSULTA).
var TIPOS_ATENDIMENTO = ['INTERCONSULTA', 'EQUIPE', 'BUSCA ATIVA', 'ESPONTÂNEA', 'SEGUIMENTO PSICOLÓGICO'];
var SEXOS_PACIENTE = ['FEMININO', 'MASCULINO', 'INTERSEXO'];
var PUBLICOS_ATENDIMENTO = ['PACIENTE', 'FAMÍLIA', 'PACIENTE E FAMÍLIA'];
var PARA_QUEM_SOLICITACAO = ['PACIENTE', 'FAMILIAR'];
var TIPOS_PRIORIDADE = { solicitacao: 'SOLICITAÇÃO', seguimento: 'SEGUIMENTO' };
/** Com estas respostas em "necessidade de acompanhamento", a admissão não tem prazo de retorno. */
var SEM_ACOMPANHAMENTO = ['NÃO', 'N / A'];

var DESCRICOES_BASE = [
  'ACOLHIMENTO A ÓBITO', 'RISCO DE SUICÍDIO', 'CUIDADOS DE FIM DE VIDA', 'CUIDADOS PALIATIVOS',
  'HISTÓRICO DE TRANSTORNO MENTAL', 'HISTÓRICO DE VIOLÊNCIA', 'COMUNICAÇÃO', 'ADESÃO AO TRATAMENTO',
  'INTERNAÇÃO PROLONGADA', 'HUMOR DEPRIMIDO OU ANSIOSO', 'VISITA DE CRIANÇA / VISITA ESTENDIDA'
];

/** Listas usadas nos campos de seleção. Editáveis pela coordenação na tela de cadastros. */
var LISTAS_INICIAIS = {
  TIPO_SOLICITACAO: ['EQUIPE', 'BUSCA ATIVA', 'ESPONTÂNEA', 'SEGUIMENTO PSICOLÓGICO'],
  DESCRICAO_DEMANDA: DESCRICOES_BASE.concat(['SEM CONDIÇÕES CLÍNICAS E/OU SOCIAIS', 'RECUSA', 'SEM DEMANDA']),
  NECESSIDADE_ACOMPANHAMENTO: ['PACIENTE', 'PACIENTE E FAMÍLIA', 'FAMÍLIA', 'NÃO', 'N / A'],
  ATIVIDADE_ASSISTENCIAL: [
    'FICHA DE ADMISSÃO', 'DISCUSSÃO DE CASO', 'REUNIÃO FAMILIAR', 'VISITA DE CRIANÇA', 'VISITA ESTENDIDA',
    'VISITA VIRTUAL', 'PRONTUÁRIO AFETIVO', 'INTERVENÇÃO CONJUNTA', 'ACOLHIMENTO AO ÓBITO',
    'ENCAMINHAMENTO / RELATÓRIO PSICOLÓGICO'
  ],
  REUNIAO_EQUIPE: ['REUNIÃO MULTIPROFISSIONAL', 'TIME DE LIDERANÇA', 'GRUPO', 'SUPERVISÃO'],
  ATIVIDADE_GERENCIAL: [
    'REUNIÃO PSICOLOGIA', 'REUNIÃO ESTÁGIO', 'REUNIÃO GESTORES', 'REUNIÃO DIREÇÃO', 'REUNIÃO NUGESP',
    'ASSESSORIA', 'COMISSÕES - BIOÉTICA / CUIDAR + / COSEP / E - DOT', 'TREINAMENTO',
    'TIME JORNADA DO CUIDADO', 'REABILITA SEPSE', 'PSI ISGH', 'VISITA TÉCNICA', 'ESTUDO DE CASO PSI + SS'
  ]
};

/** Desfechos: os que encerram a admissão (paciente saiu do hospital) e os que encerram só o acompanhamento. */
var DESFECHOS_INICIAIS = [
  ['ALTA', 'SIM'], ['ÓBITO', 'SIM'], ['TRANSFERÊNCIA', 'SIM'],
  ['SEM CONDIÇÕES CLÍNICAS E/OU SOCIAIS', 'NÃO'], ['ALTA PSICOLÓGICA', 'NÃO'], ['RECUSA', 'NÃO']
];

/** Parâmetros editáveis pela coordenação. */
var PARAMETROS_INICIAIS = [
  ['PRAZO_PRIMEIRO_ATENDIMENTO_DIAS_UTEIS', '3', 'Dias úteis, a partir da admissão no hospital, para o 1º atendimento (avaliação).'],
  ['TIPOS_SOLICITACAO_COM_PRAZO', 'EQUIPE', 'Tipos de solicitação que têm prazo de resposta pela matriz de atendimento (separados por vírgula).']
];

/** Prioridades das matrizes do HGWA: [tipo, nome, prazo, periodicidade]. */
var PRIORIDADES_INICIAIS = [
  ['SOLICITAÇÃO', 'ALTA', '1', 'Atender em até 1 dia útil'],
  ['SOLICITAÇÃO', 'MODERADA', '2', 'Atender em até 2 dias úteis'],
  ['SOLICITAÇÃO', 'BAIXA', '3', 'Atender em até 3 dias úteis'],
  ['SEGUIMENTO', 'ALTA', '2', '3x por semana ou mais'],
  ['SEGUIMENTO', 'MODERADA', '3', '2x por semana ou mais'],
  ['SEGUIMENTO', 'BAIXA', '5', '1x por semana ou mais'],
  ['SEGUIMENTO', 'MONITORAMENTO', '10', '1x a cada 15 dias']
];

/** Matriz de prioridade para atendimento psicológico: [motivo da solicitação, prioridade]. */
var MOTIVOS_SOLICITACAO_INICIAIS = [
  ['ACOLHIMENTO A ÓBITO', 'ALTA'], ['RISCO DE SUICÍDIO', 'ALTA'], ['CUIDADOS DE FIM DE VIDA', 'ALTA'],
  ['CUIDADOS PALIATIVOS', 'MODERADA'], ['HISTÓRICO DE TRANSTORNO MENTAL', 'MODERADA'],
  ['HISTÓRICO DE VIOLÊNCIA', 'MODERADA'], ['COMUNICAÇÃO', 'MODERADA'], ['ADESÃO AO TRATAMENTO', 'MODERADA'],
  ['INTERNAÇÃO PROLONGADA', 'BAIXA'], ['HUMOR DEPRIMIDO OU ANSIOSO', 'BAIXA'],
  ['VISITA DE CRIANÇA / VISITA ESTENDIDA', 'BAIXA'],
  ['TRIAGEM PSICOLÓGICA', ''], ['REABILITA SEPSE', '']
];

/** Matriz de prioridade para seguimento psicológico: [justificativa de acompanhamento, prioridade]. */
var JUSTIFICATIVAS_INICIAIS = [
  ['RISCO DE SUICÍDIO', 'ALTA'], ['INST. PSIQ. COM RISCO A SI OU A TERCEIROS', 'ALTA'],
  ['INST. PSIQ. SEM RISCO A SI OU A TERCEIROS', 'MODERADA'], ['CUIDADOS PALIATIVOS OU FIM DE VIDA', 'MODERADA'],
  ['ADESÃO AO TRATAMENTO', 'MODERADA'], ['POUCOS RECURSOS DE ENFRENTAMENTO', 'MODERADA'],
  ['BONS A PARCIAIS RECURSOS DE ENFRENTAMENTO', 'BAIXA'], ['INTERNAÇÃO PROLONGADA', 'MONITORAMENTO'],
  ['SEM CONDIÇÕES CLÍNICAS / SOCIAIS', ''], ['SEM DEMANDA PARA ACOMPANHAMENTO', '']
];

/** Justificativas acrescentadas em versões novas: o "configurar" inclui em bancos já existentes, se faltarem. */
var JUSTIFICATIVAS_GARANTIDAS = [['SEM DEMANDA PARA ACOMPANHAMENTO', '']];

/** Feriados nacionais. Estaduais, municipais e pontos facultativos são incluídos pela coordenação. */
var FERIADOS_NACIONAIS = [
  ['2026-01-01', 'CONFRATERNIZAÇÃO UNIVERSAL'], ['2026-04-03', 'SEXTA-FEIRA SANTA'], ['2026-04-21', 'TIRADENTES'],
  ['2026-05-01', 'DIA DO TRABALHO'], ['2026-09-07', 'INDEPENDÊNCIA'], ['2026-10-12', 'NOSSA SENHORA APARECIDA'],
  ['2026-11-02', 'FINADOS'], ['2026-11-15', 'PROCLAMAÇÃO DA REPÚBLICA'], ['2026-11-20', 'CONSCIÊNCIA NEGRA'],
  ['2026-12-25', 'NATAL'],
  ['2027-01-01', 'CONFRATERNIZAÇÃO UNIVERSAL'], ['2027-03-26', 'SEXTA-FEIRA SANTA'], ['2027-04-21', 'TIRADENTES'],
  ['2027-05-01', 'DIA DO TRABALHO'], ['2027-09-07', 'INDEPENDÊNCIA'], ['2027-10-12', 'NOSSA SENHORA APARECIDA'],
  ['2027-11-02', 'FINADOS'], ['2027-11-15', 'PROCLAMAÇÃO DA REPÚBLICA'], ['2027-11-20', 'CONSCIÊNCIA NEGRA'],
  ['2027-12-25', 'NATAL']
];

/** Setores e suas unidades, na ordem em que aparecem nas telas e no compilado. */
var SETORES_INICIAIS = [
  { nome: 'CLÍNICA PEDIÁTRICA', unidades: ['PED 1', 'PED 2', 'UCE PED'] },
  { nome: 'CETIP', unidades: ['UTI PED', 'UTIN', 'UCINCO'] },
  { nome: 'UTI', unidades: ['UTI 1', 'UTI 2', 'UTI 3'] },
  { nome: 'UCE', unidades: ['UCE'] },
  { nome: 'AVC', unidades: ['AVC'] },
  { nome: 'CLÍNICA MÉDICA 1', unidades: ['CM 1'] },
  { nome: 'CLÍNICA MÉDICA 2', unidades: ['CM 2'] },
  { nome: 'CLÍNICA MÉDICA 3', unidades: ['CM 3'] },
  { nome: 'CLÍNICA MÉDICA 4', unidades: ['CM 4'] },
  { nome: 'CLÍNICA MÉDICA 5', unidades: ['CM 5'] },
  { nome: 'CLÍNICA CIRÚRGICA', unidades: ['CM 6', 'CIRÚRGICA'] }
];

// ===== Regras.js =====
/**
 * Regras de negócio puras (sem chamadas ao Google). Testadas em tests/regras.test.js.
 * Datas circulam como texto 'AAAA-MM-DD' para não sofrer com fuso horário.
 */

var MS_DIA = 24 * 60 * 60 * 1000;

/** Converte 'AAAA-MM-DD', 'DD/MM/AAAA' ou Date em 'AAAA-MM-DD'. Retorna '' se vazio ou inválido. */
function normalizarData(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    if (isNaN(valor.getTime())) return '';
    return [valor.getFullYear(), doisDigitos(valor.getMonth() + 1), doisDigitos(valor.getDate())].join('-');
  }
  var texto = String(valor).trim();
  var iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) return dataValida(+iso[1], +iso[2], +iso[3]) ? iso[1] + '-' + iso[2] + '-' + iso[3] : '';
  var br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
  if (br) return dataValida(+br[3], +br[2], +br[1]) ? br[3] + '-' + doisDigitos(+br[2]) + '-' + doisDigitos(+br[1]) : '';
  return '';
}

function doisDigitos(n) {
  return (n < 10 ? '0' : '') + n;
}

function dataValida(ano, mes, dia) {
  var d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

function paraUtc(dataIso) {
  var p = dataIso.split('-');
  return Date.UTC(+p[0], +p[1] - 1, +p[2]);
}

/** Dias corridos de `inicio` até `fim`, como a função DAYS(fim; inicio) da planilha. '' se faltar data. */
function diasEntre(inicio, fim) {
  var a = normalizarData(inicio);
  var b = normalizarData(fim);
  if (!a || !b) return '';
  return Math.round((paraUtc(b) - paraUtc(a)) / MS_DIA);
}

/** Segunda-feira da semana da data, em 'AAAA-MM-DD'. */
function inicioSemana(data) {
  var d = normalizarData(data);
  if (!d) return '';
  var utc = new Date(paraUtc(d));
  var diaSemana = (utc.getUTCDay() + 6) % 7; // segunda = 0
  return normalizarDataUtc(new Date(utc.getTime() - diaSemana * MS_DIA));
}

function normalizarDataUtc(d) {
  return [d.getUTCFullYear(), doisDigitos(d.getUTCMonth() + 1), doisDigitos(d.getUTCDate())].join('-');
}

/** Soma (ou subtrai) dias corridos a uma data 'AAAA-MM-DD'. */
function adicionarDias(data, dias) {
  var d = normalizarData(data);
  if (!d) return '';
  return normalizarDataUtc(new Date(paraUtc(d) + Number(dias) * MS_DIA));
}

/** 'AAAA-MM' da data, usado para agrupar o compilado mensal. */
function mesReferencia(data) {
  var d = normalizarData(data);
  return d ? d.slice(0, 7) : '';
}

/** Prontuário só com dígitos (a planilha guarda como número, ex.: 152429.0). */
function normalizarProntuario(valor) {
  if (valor === null || valor === undefined) return '';
  var texto = String(valor).trim().replace(/\.0+$/, '');
  return texto.replace(/\D/g, '');
}

/** Maiúsculas, sem acentos e sem espaços repetidos: base para busca e comparação de nomes. */
function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

/** Nome do paciente como é gravado: maiúsculas, sem espaços sobrando, mantendo acentos. */
function formatarNome(valor) {
  return String(valor || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

var ROTULOS_DATA_ADMISSAO = {
  data_admissao: 'admissão', data_solicitacao: 'solicitação', data_desfecho: 'desfecho'
};

/** Lista de erros de preenchimento da admissão. Vazia quando está tudo certo. */
function validarAdmissao(adm, hojeIso, permitirJustificativaPendente) {
  var erros = [];
  if (!adm.paciente_id) erros.push('Informe o paciente.');
  if (!normalizarData(adm.data_admissao)) erros.push('Informe a data de admissão no hospital.');
  if (!adm.unidade_id) erros.push('Informe a unidade.');

  Object.keys(ROTULOS_DATA_ADMISSAO).forEach(function (campo) {
    var d = normalizarData(adm[campo]);
    if (d && hojeIso && d > hojeIso) erros.push('A data de ' + ROTULOS_DATA_ADMISSAO[campo] + ' está no futuro.');
    if (d && campo !== 'data_admissao' && diasEntre(adm.data_admissao, d) < 0) {
      erros.push('A data de ' + ROTULOS_DATA_ADMISSAO[campo] + ' não pode ser antes da admissão.');
    }
  });

  if (normalizarData(adm.data_solicitacao) && !normalizarHora(adm.hora_solicitacao)) {
    erros.push('Informe a hora da solicitação.');
  }
  if (adm.para_quem === 'FAMILIAR' && !String(adm.familiar_nome || '').trim() && !String(adm.familiar_parentesco || '').trim()) {
    erros.push('Informe o nome ou o parentesco do familiar.');
  }

  var temData = Boolean(normalizarData(adm.data_desfecho));
  if (adm.desfecho_id && !temData) erros.push('Informe a data do desfecho.');
  if (temData && !adm.desfecho_id) erros.push('Informe o desfecho.');
  var acompanha = adm.necessidade_acompanhamento && SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) === -1;
  if (acompanha && !adm.justificativa_id && !permitirJustificativaPendente) erros.push('Informe a justificativa do acompanhamento.');
  return erros;
}

/** Procura pacientes pelo prontuário (exato) ou por parte do nome (sem acento). */
function filtrarPacientes(pacientes, termo, limite) {
  var max = limite || 20;
  var prontuario = normalizarProntuario(termo);
  var nome = normalizarTexto(termo);
  if (!nome) return [];
  var porProntuario = /^\d+$/.test(String(termo).trim().replace(/\.0+$/, ''));
  return pacientes.filter(function (p) {
    return porProntuario
      ? normalizarProntuario(p.prontuario) === prontuario
      : normalizarTexto(p.nome).indexOf(nome) !== -1;
  }).slice(0, max);
}

/** Paciente já cadastrado com o mesmo prontuário (ignora o próprio registro na edição). */
function acharDuplicado(pacientes, paciente) {
  var prontuario = normalizarProntuario(paciente.prontuario);
  if (!prontuario) return null;
  for (var i = 0; i < pacientes.length; i++) {
    var p = pacientes[i];
    if (p.id !== paciente.id && normalizarProntuario(p.prontuario) === prontuario) return p;
  }
  return null;
}

// ---------- Dias úteis e prazos do acompanhamento ----------

/** Lista de feriados ({ data }) vira um conjunto para consulta rápida. */
function conjuntoFeriados(feriados) {
  var conjunto = {};
  (feriados || []).forEach(function (f) {
    var d = normalizarData(f && f.data !== undefined ? f.data : f);
    if (d) conjunto[d] = true;
  });
  return conjunto;
}

function ehDiaUtil(dataIso, feriados) {
  var diaSemana = new Date(paraUtc(dataIso)).getUTCDay();
  return diaSemana !== 0 && diaSemana !== 6 && !(feriados && feriados[dataIso]);
}

/** Data `n` dias úteis depois de `data` (sábado, domingo e feriados não contam). */
function adicionarDiasUteis(data, n, feriados) {
  var atual = normalizarData(data);
  if (!atual) return '';
  var restantes = Number(n) || 0;
  while (restantes > 0) {
    atual = normalizarDataUtc(new Date(paraUtc(atual) + MS_DIA));
    if (ehDiaUtil(atual, feriados)) restantes--;
  }
  return atual;
}

function prazoDaJustificativa(prazos, justificativaId) {
  var p = prazos[justificativaId];
  return p === '' || p === undefined || p === null || isNaN(Number(p)) ? null : Number(p);
}

var PUBLICOS_COM_FAMILIA = ['FAMÍLIA', 'PACIENTE E FAMÍLIA'];

/**
 * Todo atendimento conta para os prazos: ao paciente, à família ou aos dois (decisão da coordenação, v27).
 * O campo paciente_impossibilitado dos registros antigos não muda mais o resultado.
 */
function contaParaPrazo(atendimento) {
  return atendimento.publico === 'PACIENTE' || PUBLICOS_COM_FAMILIA.indexOf(atendimento.publico) !== -1;
}

/** Atendimento que incluiu o paciente (sozinho ou junto com a família). */
function atendeuPaciente(publico) {
  return publico === 'PACIENTE' || publico === 'PACIENTE E FAMÍLIA';
}

/** Atendimento que incluiu familiares; `quantidade` é o número de familiares atendidos. */
function atendeuFamilia(publico) {
  return PUBLICOS_COM_FAMILIA.indexOf(publico) !== -1;
}

var STATUS_ADMISSAO = {
  aguardando: 'AGUARDANDO 1º ATENDIMENTO',
  acompanhamento: 'EM ACOMPANHAMENTO',
  acompanhamentoEncerrado: 'ACOMPANHAMENTO ENCERRADO',
  encerrada: 'ENCERRADA'
};

/**
 * Tudo o que o sistema calcula numa admissão.
 *
 * - 1º atendimento (avaliação): o primeiro atendimento que conta para prazo tem que acontecer
 *   em até `diasPrimeiro` dias úteis da admissão no hospital. Se o paciente teve desfecho dentro
 *   desse prazo sem ter sido atendido, a admissão fica fora do indicador ("NÃO SE APLICA").
 * - Retornos: depois de cada atendimento que conta, o próximo tem que acontecer em até N dias úteis,
 *   onde N é o prazo da justificativa vigente naquele atendimento.
 *
 * @param adm a admissão
 * @param atendimentos atendimentos da admissão
 * @param op { prazos: {justificativa_id: dias}, feriados: conjunto, diasPrimeiro, desfechoEncerra, hoje }
 */
function calcularAdmissao(adm, atendimentos, op) {
  var feriados = op.feriados || {};
  var hojeIso = normalizarData(op.hoje);
  var prazoPrimeiro = adicionarDiasUteis(adm.data_admissao, op.diasPrimeiro, feriados);
  var retomado = normalizarData(adm.retomado_em);

  var contatos = atendimentos.filter(function (a) { return normalizarData(a.data) && contaParaPrazo(a); })
    .slice().sort(function (a, b) {
      var da = normalizarData(a.data);
      var db = normalizarData(b.data);
      if (da !== db) return da < db ? -1 : 1;
      var ca = String(a.criado_em || '');
      var cb = String(b.criado_em || '');
      return ca < cb ? -1 : ca > cb ? 1 : 0;
    });

  var porAtendimento = {};
  atendimentos.forEach(function (a) {
    porAtendimento[a.id] = { prazo_limite: '', no_prazo: '', conta_prazo: contaParaPrazo(a) ? 'SIM' : 'NÃO', tipo_prazo: '' };
  });

  var anterior = null;
  var i = 0;
  while (i < contatos.length) {
    var dia = normalizarData(contatos[i].data);
    var doDia = [];
    while (i < contatos.length && normalizarData(contatos[i].data) === dia) doDia.push(contatos[i++]);

    // Acompanhamento retomado depois de um desfecho psicológico: o prazo recomeça na retomada.
    if (retomado && (!anterior || anterior.data < retomado) && retomado <= dia) {
      anterior = { data: retomado, justificativa_id: doDia[0].justificativa_id || adm.justificativa_id };
    }
    var limite;
    if (!anterior) {
      limite = prazoPrimeiro;
    } else {
      var prazo = prazoDaJustificativa(op.prazos, anterior.justificativa_id || adm.justificativa_id);
      limite = prazo === null || anterior.data >= dia ? '' : adicionarDiasUteis(anterior.data, prazo, feriados);
    }
    var tipo = anterior ? 'RETORNO' : 'PRIMEIRO';
    doDia.forEach(function (a) {
      porAtendimento[a.id].tipo_prazo = tipo;
      porAtendimento[a.id].prazo_limite = limite;
      porAtendimento[a.id].no_prazo = limite ? (dia <= limite ? 'SIM' : 'NÃO') : '';
    });
    anterior = { data: dia, justificativa_id: doDia[doDia.length - 1].justificativa_id || adm.justificativa_id };
  }

  var primeiro = contatos.length ? normalizarData(contatos[0].data) : '';
  var dataDesfecho = normalizarData(adm.data_desfecho);
  var status;
  if (adm.desfecho_id && dataDesfecho) status = op.desfechoEncerra ? STATUS_ADMISSAO.encerrada : STATUS_ADMISSAO.acompanhamentoEncerrado;
  else status = primeiro ? STATUS_ADMISSAO.acompanhamento : STATUS_ADMISSAO.aguardando;

  var primeiroNoPrazo;
  if (primeiro) primeiroNoPrazo = primeiro <= prazoPrimeiro ? 'SIM' : 'NÃO';
  else if (dataDesfecho && dataDesfecho <= prazoPrimeiro) primeiroNoPrazo = 'NÃO SE APLICA';
  else if (dataDesfecho || (hojeIso && hojeIso > prazoPrimeiro)) primeiroNoPrazo = 'NÃO';
  else primeiroNoPrazo = 'EM ANDAMENTO';

  var ultimo = anterior ? anterior.data : '';
  if (retomado && retomado > ultimo) ultimo = retomado;
  var proximo = '';
  if (status === STATUS_ADMISSAO.aguardando) {
    proximo = prazoPrimeiro;
  } else if (status === STATUS_ADMISSAO.acompanhamento) {
    // v27: o próximo retorno depende só da justificativa vigente (sem prazo = "SEM DEMANDA PARA ACOMPANHAMENTO"
    // ou "SEM CONDIÇÕES"). Admissões antigas com necessidade "NÃO" ou "N / A" continuam sem prazo.
    var semAcompanhamento = SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) !== -1;
    var prazoAtual = prazoDaJustificativa(op.prazos, adm.justificativa_id);
    if (!semAcompanhamento && prazoAtual !== null) proximo = adicionarDiasUteis(ultimo, prazoAtual, feriados);
  }

  return {
    porAtendimento: porAtendimento,
    campos: {
      status: status,
      prazo_primeiro_atendimento: prazoPrimeiro,
      primeiro_atendimento: primeiro,
      primeiro_no_prazo: primeiroNoPrazo,
      dias_ate_primeiro_atendimento: diasEntre(adm.data_admissao, primeiro),
      ultimo_contato: ultimo,
      proximo_prazo: proximo
    }
  };
}

/** Próximo dia útil depois de `data` (amanhã, ou segunda-feira quando `data` é sexta). */
function proximoDiaUtil(data, feriados) {
  return adicionarDiasUteis(data, 1, feriados || {});
}

/**
 * Como está o prazo do próximo atendimento em relação a hoje.
 * VENCE AMANHÃ = vence no próximo dia útil (numa sexta, o que vence na segunda).
 */
function situacaoPrazo(proximoPrazo, hoje, feriados) {
  var p = normalizarData(proximoPrazo);
  var h = normalizarData(hoje);
  if (!p || !h) return '';
  if (p < h) return 'ATRASADO';
  if (p === h) return 'VENCE HOJE';
  if (p <= proximoDiaUtil(h, feriados)) return 'VENCE AMANHÃ';
  return 'NO PRAZO';
}

/** Atendimentos de residentes e estagiários não entram nos números da empresa. */
function contaParaEmpresa(categoria) {
  return categoria === CATEGORIA_EMPRESA;
}

// ---------- Horas: prazo de resposta à solicitação ----------

/** 'H:MM' ou 'HH:MM' → 'HH:MM'. Retorna '' se vazio ou inválido. */
function normalizarHora(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return isNaN(valor.getTime()) ? '' : doisDigitos(valor.getHours()) + ':' + doisDigitos(valor.getMinutes());
  }
  var m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(valor).trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return '';
  return doisDigitos(Number(m[1])) + ':' + m[2];
}

/** Data e hora juntas, 'AAAA-MM-DD HH:MM'. Sem hora vale 00:00. '' se não houver data. */
function dataHora(data, hora) {
  var d = normalizarData(data);
  if (!d) return '';
  return d + ' ' + (normalizarHora(hora) || '00:00');
}

function dataHoraParaUtc(dh) {
  var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(dh || '');
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : NaN;
}

/** Soma horas corridas a 'AAAA-MM-DD HH:MM'. */
function adicionarHoras(dh, horas) {
  var t = dataHoraParaUtc(dh);
  if (isNaN(t)) return '';
  var d = new Date(t + Number(horas) * 60 * 60 * 1000);
  return normalizarDataUtc(d) + ' ' + doisDigitos(d.getUTCHours()) + ':' + doisDigitos(d.getUTCMinutes());
}

/** Horas corridas entre dois 'AAAA-MM-DD HH:MM', com uma casa decimal. */
function horasEntre(inicio, fim) {
  var a = dataHoraParaUtc(inicio);
  var b = dataHoraParaUtc(fim);
  if (isNaN(a) || isNaN(b)) return '';
  return Math.round((b - a) / 360000) / 10;
}

/** Horas úteis: todos os minutos dos dias úteis, sem expediente diário presumido. */
function adicionarHorasUteis(inicio, horas, feriados) {
  var t = dataHoraParaUtc(inicio), n = Number(horas);
  if (!isFinite(t) || !isFinite(n) || n < 0) return '';
  var minutos = Math.round(n * 60), dia = inicio.slice(0, 10);
  var minuto = Number(inicio.slice(11, 13)) * 60 + Number(inicio.slice(14, 16));
  while (true) {
    if (!ehDiaUtil(dia, feriados || {})) {
      dia = adicionarDias(dia, 1);
      minuto = 0;
      continue;
    }
    var disponivel = 1440 - minuto;
    if (minutos < disponivel) {
      minuto += minutos;
      return dia + ' ' + doisDigitos(Math.floor(minuto / 60)) + ':' + doisDigitos(minuto % 60);
    }
    minutos -= disponivel;
    dia = adicionarDias(dia, 1);
    minuto = 0;
  }
}

/** Mede horas úteis, inclusive em sentido negativo para mostrar o atraso. */
function horasUteisEntre(inicio, fim, feriados) {
  var a = dataHoraParaUtc(inicio), b = dataHoraParaUtc(fim);
  if (!isFinite(a) || !isFinite(b)) return '';
  if (b < a) return -horasUteisEntre(fim, inicio, feriados);
  var dia = inicio.slice(0, 10), total = 0;
  while (paraUtc(dia) < b) {
    var proximo = adicionarDias(dia, 1);
    if (ehDiaUtil(dia, feriados || {})) total += Math.max(0, Math.min(b, paraUtc(proximo)) - Math.max(a, paraUtc(dia)));
    dia = proximo;
  }
  return Math.round(total / 360000) / 10;
}

/**
 * Dias úteis depois de `inicio` até `fim` ('AAAA-MM-DD'), sem contar o próprio `inicio`.
 * Mesmo dia = 0. Negativo quando `fim` vem antes (para mostrar o atraso).
 */
function diasUteisEntre(inicio, fim, feriados) {
  var a = normalizarData(inicio);
  var b = normalizarData(fim);
  if (!a || !b) return '';
  if (b < a) return -diasUteisEntre(b, a, feriados);
  var n = 0;
  for (var d = a; d < b;) {
    d = adicionarDias(d, 1);
    if (ehDiaUtil(d, feriados || {})) n++;
  }
  return n;
}

/**
 * Resposta à solicitação (matriz de atendimento): o primeiro atendimento depois da solicitação
 * tem que acontecer em até N dias úteis, conforme a prioridade do motivo (v27: alta 1, moderada 2, baixa 3).
 * Não conta o dia do pedido; pedido em dia não útil começa a contar no próximo dia útil. O prazo vence
 * no fim do dia: atendimento no último dia, em qualquer horário, está no prazo. A hora continua
 * registrada só para saber se o atendimento veio depois da solicitação.
 * Qualquer atendimento responde: ao paciente, à família ou aos dois (v27).
 *
 * @param adm a admissão (ou a interconsulta)
 * @param atendimentos atendimentos da admissão (data, hora, publico)
 * @param op { prioridade: { nome, prazo (dias úteis) } ou null, tiposComPrazo: [tipos], agora: 'AAAA-MM-DD HH:MM', feriados: conjunto }
 * @return { prioridade_solicitacao, prazo_resposta ('AAAA-MM-DD'), momento_resposta, dias_resposta, horas_resposta, resposta_no_prazo }
 *   resposta_no_prazo: SIM, NÃO, EM ANDAMENTO, NÃO SE APLICA (desfecho antes do prazo sem resposta),
 *   SEM PRAZO (tipo ou motivo sem prazo) ou '' (sem solicitação).
 */
function calcularResposta(adm, atendimentos, op) {
  var vazio = { prioridade_solicitacao: '', prazo_resposta: '', momento_resposta: '', dias_resposta: '', horas_resposta: '', resposta_no_prazo: '' };
  var inicio = normalizarHora(adm.hora_solicitacao) ? dataHora(adm.data_solicitacao, adm.hora_solicitacao) : '';
  if (!inicio) return vazio;

  var prioridade = op.prioridade;
  var diasPrazo = prioridade && prioridade.prazo !== '' && !isNaN(Number(prioridade.prazo)) ? Number(prioridade.prazo) : null;
  var temPrazo = diasPrazo !== null && (op.tiposComPrazo || []).indexOf(adm.tipo_solicitacao) !== -1;

  var resposta = '';
  atendimentos.forEach(function (a) {
    var dh = dataHora(a.data, a.hora);
    if (!dh || dh < inicio) return;
    var vale = contaParaPrazo(a);
    if (vale && (!resposta || dh < resposta)) resposta = dh;
  });

  var prazo = temPrazo ? adicionarDiasUteis(adm.data_solicitacao, diasPrazo, op.feriados) : '';
  var situacao;
  if (!temPrazo) situacao = 'SEM PRAZO';
  else if (resposta) situacao = resposta.slice(0, 10) <= prazo ? 'SIM' : 'NÃO';
  else {
    var desfecho = normalizarData(adm.data_desfecho);
    if (desfecho && desfecho <= prazo) situacao = 'NÃO SE APLICA';
    else if (desfecho || (op.agora && op.agora.slice(0, 10) > prazo)) situacao = 'NÃO';
    else situacao = 'EM ANDAMENTO';
  }
  return {
    prioridade_solicitacao: prioridade ? prioridade.nome : '',
    prazo_resposta: prazo,
    momento_resposta: resposta,
    dias_resposta: resposta ? diasUteisEntre(adm.data_solicitacao, resposta, op.feriados) : '',
    horas_resposta: resposta ? horasUteisEntre(inicio, resposta, op.feriados) : '',
    resposta_no_prazo: situacao
  };
}

/** Situação de um prazo com hora ('AAAA-MM-DD HH:MM') em relação a agora. */
function situacaoPrazoHora(prazo, agora, feriados) {
  if (!prazo || !agora) return '';
  if (prazo < agora) return 'ATRASADO';
  if (prazo.slice(0, 10) === agora.slice(0, 10)) return 'VENCE HOJE';
  if (prazo.slice(0, 10) <= proximoDiaUtil(agora.slice(0, 10), feriados)) return 'VENCE AMANHÃ';
  return 'NO PRAZO';
}

var GRAVIDADE_SITUACAO = { 'ATRASADO': 4, 'VENCE HOJE': 3, 'VENCE AMANHÃ': 2, 'NO PRAZO': 1, '': 0 };

/** A mais urgente de duas situações. */
function situacaoMaisUrgente(a, b) {
  return (GRAVIDADE_SITUACAO[a || ''] || 0) >= (GRAVIDADE_SITUACAO[b || ''] || 0) ? (a || '') : (b || '');
}

// ---------- Gestão: os três prazos de uma admissão ----------

/**
 * Situação de cada prazo da admissão, para as telas de gestão:
 * 1º atendimento após a admissão, resposta à interconsulta e próximo retorno do seguimento.
 * Cada um: { estado: PENDENTE | CUMPRIDO | NÃO REALIZADO | NÃO SE APLICA | SEM PRAZO | '', prazo,
 *            situacao (se pendente): ATRASADO | VENCE HOJE | VENCE AMANHÃ | NO PRAZO, resultado (se cumprido): NO PRAZO | FORA DO PRAZO }
 * proximo: o prazo pendente mais urgente ({ tipo, prazo, situacao }) ou null.
 */
function prazosDaAdmissao(adm, hojeIso, agoraDh, feriados) {
  var ativa = adm.status !== STATUS_ADMISSAO.encerrada && !adm.desfecho_id;

  var primeiro = { prazo: adm.prazo_primeiro_atendimento || '' };
  if (adm.primeiro_no_prazo === 'NÃO SE APLICA') primeiro.estado = 'NÃO SE APLICA';
  else if (adm.primeiro_atendimento) {
    primeiro.estado = 'CUMPRIDO';
    primeiro.realizado = adm.primeiro_atendimento;
    primeiro.resultado = adm.primeiro_no_prazo === 'SIM' ? 'NO PRAZO' : 'FORA DO PRAZO';
  } else if (ativa) {
    primeiro.estado = 'PENDENTE';
    primeiro.situacao = situacaoPrazo(primeiro.prazo, hojeIso, feriados);
  } else {
    primeiro.estado = 'NÃO REALIZADO';
    primeiro.resultado = 'FORA DO PRAZO';
  }

  var interconsulta = { prazo: adm.prazo_resposta || '', prioridade: adm.prioridade_solicitacao || '' };
  var r = adm.resposta_no_prazo;
  if (!r) interconsulta.estado = '';
  else if (r === 'SEM PRAZO') interconsulta.estado = 'SEM PRAZO';
  else if (r === 'NÃO SE APLICA') interconsulta.estado = 'NÃO SE APLICA';
  else if (adm.momento_resposta) {
    interconsulta.estado = 'CUMPRIDO';
    interconsulta.realizado = adm.momento_resposta;
    interconsulta.dias = adm.dias_resposta;
    interconsulta.resultado = r === 'SIM' ? 'NO PRAZO' : 'FORA DO PRAZO';
  } else if (ativa) {
    interconsulta.estado = 'PENDENTE';
    // Prazo em dias úteis, sem hora (v27): vence no fim do dia.
    interconsulta.situacao = situacaoPrazo(interconsulta.prazo, hojeIso, feriados);
    interconsulta.dias_restantes = diasUteisEntre(hojeIso, interconsulta.prazo, feriados);
  } else {
    interconsulta.estado = 'NÃO REALIZADO';
    interconsulta.resultado = 'FORA DO PRAZO';
  }

  var retorno = { prazo: '', prioridade: adm.prioridade_demanda || '', ultimo: adm.ultimo_contato || '' };
  if (adm.status !== STATUS_ADMISSAO.acompanhamento || adm.desfecho_id) retorno.estado = '';
  else if (adm.proximo_prazo) {
    retorno.estado = 'PENDENTE';
    retorno.prazo = adm.proximo_prazo;
    retorno.situacao = situacaoPrazo(retorno.prazo, hojeIso, feriados);
  } else retorno.estado = 'SEM PRAZO';

  var pendentes = [['1º ATENDIMENTO', primeiro], ['INTERCONSULTA', interconsulta], ['RETORNO', retorno]]
    .filter(function (p) { return p[1].estado === 'PENDENTE'; });
  pendentes.sort(function (a, b) {
    var g = GRAVIDADE_SITUACAO[b[1].situacao] - GRAVIDADE_SITUACAO[a[1].situacao];
    if (g) return g;
    return a[1].prazo < b[1].prazo ? -1 : a[1].prazo > b[1].prazo ? 1 : 0;
  });
  var proximo = pendentes.length ? { tipo: pendentes[0][0], prazo: pendentes[0][1].prazo, situacao: pendentes[0][1].situacao } : null;
  return { primeiro: primeiro, interconsulta: interconsulta, retorno: retorno, proximo: proximo };
}

// ===== Indicadores.js =====
/**
 * Compilado: indicadores mensais por unidade ou anuais por mês. Funções puras, testadas no Node.
 */

var MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
var MESES_NOME = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO',
  'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

/** Grupos do compilado. Residentes e estagiários não entram nos números da empresa. */
var GRUPOS_COMPILADO = {
  'TODOS': 'Todos os profissionais',
  'EMPRESA': 'Profissionais da empresa',
  'RESIDENTE': 'Residentes',
  'ESTAGIÁRIO': 'Estagiários'
};

function noGrupo(categoria, grupo) {
  if (!grupo || grupo === 'TODOS') return true;
  if (grupo === 'EMPRESA') return categoria === CATEGORIA_EMPRESA;
  return categoria === grupo;
}

/** Linha do compilado: soma por coluna, percentual ou média. */
function linhaCompilado(rotulo, tipo) {
  return { rotulo: rotulo, tipo: tipo || 'n', soma: {}, cont: {} };
}

function acumular(linha, chave, valor) {
  linha.soma[chave] = (linha.soma[chave] || 0) + valor;
  linha.cont[chave] = (linha.cont[chave] || 0) + 1;
}

/**
 * Monta o compilado.
 *
 * @param dados { unidades, admissoes, atendimentos, atividades, reunioes, gerenciais, desfechosRegistrados,
 *                motivos: [{ id, nome }], prioridades: [{ tipo, nome }],
 *                listas: { NOME_DA_LISTA: [valores] }, desfechos: [{ id, nome }] }
 * @param op { ano, mes (1 a 12, só no mensal), eixo: 'UNIDADE' | 'MES', grupo, setor_id, unidade_id, diasPrimeiro }
 * @return { titulo, subtitulo, colunas: [{ chave, nome }], secoes: [{ titulo, nota, semColunas, linhas }] }
 *   cada linha: { rotulo, tipo: 'n' | 'pct' | 'media', valores: [por coluna], total, destaque }
 */
function montarCompilado(dados, op) {
  var ano = String(op.ano);
  var mes = op.mes ? doisDigitos(Number(op.mes)) : '';
  var eixoUnidade = op.eixo !== 'MES';
  var grupo = op.grupo || 'TODOS';

  var unidadesValidas = {};
  var unidadesFiltradas = dados.unidades.filter(function (u) {
    var ok = (!op.setor_id || u.setor_id === op.setor_id) && (!op.unidade_id || u.id === op.unidade_id);
    if (ok) unidadesValidas[u.id] = true;
    return ok;
  });
  var semFiltroUnidade = !op.setor_id && !op.unidade_id;

  function noPeriodo(data) {
    var d = normalizarData(data);
    if (!d || d.slice(0, 4) !== ano) return false;
    return !mes || d.slice(5, 7) === mes;
  }
  function chave(data, unidadeId) {
    return eixoUnidade ? String(unidadeId || '') : normalizarData(data).slice(5, 7);
  }
  function aceita(data, unidadeId) {
    if (!noPeriodo(data)) return false;
    if (eixoUnidade) return Boolean(unidadesValidas[unidadeId]);
    return semFiltroUnidade || Boolean(unidadesValidas[unidadeId]);
  }

  var colunas = eixoUnidade
    ? unidadesFiltradas.map(function (u) { return { chave: String(u.id), nome: u.nome, ativo: u.ativo !== 'NÃO' }; })
    : MESES_ABREV.map(function (m, i) { return { chave: doisDigitos(i + 1), nome: m, ativo: true }; });

  var secoes = [];
  function secao(titulo, linhas, extra) {
    var s = Object.assign({ titulo: titulo, linhas: linhas }, extra || {});
    secoes.push(s);
    return s;
  }

  /** Uma linha por valor (lista conhecida + valores achados nos dados), mais o total. */
  function distribuicao(registros, valorDe, conhecidos, chaveDe, pesoDe) {
    var linhas = {};
    var ordem = [];
    (conhecidos || []).forEach(function (v) { linhas[v] = linhaCompilado(v); ordem.push(v); });
    var total = linhaCompilado('TOTAL');
    total.destaque = true;
    registros.forEach(function (r) {
      var v = valorDe(r) || 'NÃO INFORMADO';
      if (!linhas[v]) { linhas[v] = linhaCompilado(v); ordem.push(v); }
      var peso = pesoDe ? pesoDe(r) : 1;
      acumular(linhas[v], chaveDe(r), peso);
      acumular(total, chaveDe(r), peso);
    });
    return ordem.map(function (v) { return linhas[v]; }).concat([total]);
  }

  var porId = function (lista) {
    var m = {};
    lista.forEach(function (x) { m[x.id] = x; });
    return m;
  };
  var desfechos = porId(dados.desfechos || []);
  var qtd = function (r) { return Number(r.quantidade) || 1; };
  var notaServico = grupo === 'TODOS' ? '' : 'Serviço todo: admissões não se separam por categoria de profissional.';

  // 1. Atendimentos
  var atend = dados.atendimentos.filter(function (a) { return aceita(a.data, a.unidade_id) && noGrupo(a.categoria, grupo); });
  var lPac = linhaCompilado('PACIENTE (atendimentos)');
  var lFam = linhaCompilado('FAMÍLIA (pessoas atendidas)');
  var lFamAt = linhaCompilado('Atendimentos à família');
  var lTot = linhaCompilado('TOTAL DE PESSOAS ATENDIDAS');
  lTot.destaque = true;
  // Cada pessoa atendida conta 1: "PACIENTE E FAMÍLIA" soma o paciente e os familiares (v27).
  atend.forEach(function (a) {
    var c = chave(a.data, a.unidade_id);
    if (atendeuPaciente(a.publico)) {
      acumular(lPac, c, 1);
      acumular(lTot, c, 1);
    }
    if (atendeuFamilia(a.publico)) {
      acumular(lFam, c, qtd(a));
      acumular(lFamAt, c, 1);
      acumular(lTot, c, qtd(a));
    }
  });
  secao('Atendimentos', [lPac, lFam, lFamAt, lTot]);
  // Cada registro de atendimento conta 1, pelo tipo da solicitação escolhido no registro.
  secao('Atendimentos por tipo da solicitação', distribuicao(atend, function (a) { return a.tipo_atendimento || 'NÃO INFORMADO'; },
    TIPOS_ATENDIMENTO, function (a) { return chave(a.data, a.unidade_id); }),
    { nota: 'Cada atendimento registrado conta 1 (paciente e família no mesmo registro contam 1).' });

  // 2. Admissões no período (pela data de admissão no hospital)
  var adms = dados.admissoes.filter(function (a) { return aceita(a.data_admissao, a.unidade_id); });
  var chaveAdm = function (a) { return chave(a.data_admissao, a.unidade_id); };
  var listas = dados.listas || {};
  var lAdm = linhaCompilado('ADMISSÕES NO PERÍODO');
  lAdm.destaque = true;
  adms.forEach(function (a) { acumular(lAdm, chaveAdm(a), 1); });
  secao('Admissões', [lAdm], { nota: notaServico });
  var motivos = porId(dados.motivos || []);
  var prioridades = dados.prioridades || [];
  var nomesPrioridade = function (tipo) {
    return prioridades.filter(function (p) { return p.tipo === tipo; }).map(function (p) { return p.nome; });
  };
  var solicitacoes = dados.interconsultas ? dados.interconsultas.filter(function (a) { return aceita(a.data_solicitacao, a.unidade_id); }) : adms;
  var comSolicitacao = function (a) { return Boolean(a.motivo_solicitacao_id || a.data_solicitacao); };
  var porSolicitacao = function (a) { return chave(a.data_solicitacao, a.unidade_id); };
  [
    ['Tipo de solicitação', function (a) { return a.tipo_solicitacao; }, listas.TIPO_SOLICITACAO, solicitacoes],
    ['Motivo da solicitação', function (a) { return (motivos[a.motivo_solicitacao_id] || {}).nome; },
      (dados.motivos || []).map(function (m) { return m.nome; }), solicitacoes.filter(comSolicitacao)],
    ['Prioridade da solicitação', function (a) { return a.prioridade_solicitacao || 'SEM PRIORIDADE'; },
      nomesPrioridade(TIPOS_PRIORIDADE.solicitacao), solicitacoes.filter(comSolicitacao)],
    ['Solicitação para', function (a) { return a.para_quem; }, PARA_QUEM_SOLICITACAO, solicitacoes.filter(comSolicitacao)]
  ].forEach(function (d) {
    secao(d[0], distribuicao(d[3], d[1], d[2], dados.interconsultas ? porSolicitacao : chaveAdm), { nota: notaServico });
  });
  // Descrição da demanda: cada registro (1º atendimento ou mudança da demanda) conta no mês e na unidade em que foi feito.
  // Sem a lista de registros (dados antigos), conta a descrição de cada admissão do período.
  if (dados.descricoes) {
    secao('Descrição da demanda', distribuicao(dados.descricoes.filter(function (d) { return aceita(d.data, d.unidade_id); }),
      function (d) { return d.descricao; }, listas.DESCRICAO_DEMANDA, function (d) { return chave(d.data, d.unidade_id); }),
      { nota: ['Cada descrição conta no mês e na unidade em que foi registrada: no 1º atendimento ou quando a demanda mudou.', notaServico].filter(Boolean).join(' ') });
  } else {
    secao('Descrição da demanda', distribuicao(adms, function (a) { return a.descricao_demanda; }, listas.DESCRICAO_DEMANDA, chaveAdm), { nota: notaServico });
  }
  // v27: sem a seção "Necessidade de acompanhamento" (o campo saiu das telas).
  secao('Prioridade da demanda (seguimento)', distribuicao(adms, function (a) { return a.prioridade_demanda || 'SEM PRIORIDADE'; },
    nomesPrioridade(TIPOS_PRIORIDADE.seguimento), chaveAdm), { nota: notaServico });

  // 3. 1º atendimento em até N dias úteis da admissão
  var lSim = linhaCompilado('NO PRAZO');
  var lNao = linhaCompilado('FORA DO PRAZO');
  var lAnd = linhaCompilado('EM ANDAMENTO');
  var lNsa = linhaCompilado('NÃO SE APLICA (desfecho antes do prazo)');
  var lPct = linhaCompilado('% NO PRAZO', 'pct');
  lPct.num = lSim;
  lPct.den = [lSim, lNao];
  lPct.destaque = true;
  var lMedia = linhaCompilado('MÉDIA DE DIAS ATÉ O 1º ATENDIMENTO', 'media');
  var mapa = { 'SIM': lSim, 'NÃO': lNao, 'EM ANDAMENTO': lAnd, 'NÃO SE APLICA': lNsa };
  adms.forEach(function (a) {
    var c = chaveAdm(a);
    if (mapa[a.primeiro_no_prazo]) acumular(mapa[a.primeiro_no_prazo], c, 1);
    if (a.dias_ate_primeiro_atendimento !== '' && a.dias_ate_primeiro_atendimento !== undefined) {
      acumular(lMedia, c, Number(a.dias_ate_primeiro_atendimento));
    }
  });
  secao('1º atendimento em até ' + op.diasPrimeiro + ' dia(s) útil(eis) da admissão', [lSim, lNao, lAnd, lNsa, lPct, lMedia], {
    nota: [notaServico, '% no prazo = no prazo ÷ (no prazo + fora do prazo). Em andamento e não se aplica ficam fora da conta.']
      .filter(Boolean).join(' ')
  });

  // 3b. Resposta à solicitação no prazo da prioridade (matriz de atendimento), pela data da solicitação.
  var sols = (dados.interconsultas || dados.admissoes).filter(function (a) { return a.resposta_no_prazo && aceita(a.data_solicitacao, a.unidade_id); });
  var chaveSol = function (a) { return chave(a.data_solicitacao, a.unidade_id); };
  var rSim = linhaCompilado('NO PRAZO');
  var rNao = linhaCompilado('FORA DO PRAZO');
  var rAnd = linhaCompilado('EM ANDAMENTO');
  var rNsa = linhaCompilado('NÃO SE APLICA (desfecho antes do prazo)');
  var rSem = linhaCompilado('SEM PRAZO (motivo sem prioridade ou tipo sem prazo)');
  var rPct = linhaCompilado('% NO PRAZO', 'pct');
  rPct.num = rSim;
  rPct.den = [rSim, rNao];
  rPct.destaque = true;
  var rMedia = linhaCompilado('MÉDIA DE DIAS ÚTEIS ATÉ A RESPOSTA', 'media');
  var mapaResp = { 'SIM': rSim, 'NÃO': rNao, 'EM ANDAMENTO': rAnd, 'NÃO SE APLICA': rNsa, 'SEM PRAZO': rSem };
  // % no prazo por prioridade
  var porPrioridade = {};
  var ordemPrioridade = nomesPrioridade(TIPOS_PRIORIDADE.solicitacao);
  ordemPrioridade.forEach(function (n) {
    var sim = linhaCompilado('');
    var nao = linhaCompilado('');
    var pct = linhaCompilado('% NO PRAZO — ' + n, 'pct');
    pct.num = sim;
    pct.den = [sim, nao];
    porPrioridade[n] = { sim: sim, nao: nao, pct: pct };
  });
  sols.forEach(function (a) {
    var c = chaveSol(a);
    if (mapaResp[a.resposta_no_prazo]) acumular(mapaResp[a.resposta_no_prazo], c, 1);
    if (a.dias_resposta !== '' && a.dias_resposta !== undefined && a.resposta_no_prazo !== 'SEM PRAZO') {
      acumular(rMedia, c, Number(a.dias_resposta));
    }
    var pp = porPrioridade[a.prioridade_solicitacao];
    if (pp && a.resposta_no_prazo === 'SIM') acumular(pp.sim, c, 1);
    if (pp && a.resposta_no_prazo === 'NÃO') acumular(pp.nao, c, 1);
  });
  var linhasPorPrioridade = ordemPrioridade.map(function (n) { return porPrioridade[n].pct; });
  secao('Resposta à solicitação no prazo da prioridade', [rSim, rNao, rAnd, rNsa, rSem, rPct].concat(linhasPorPrioridade).concat([rMedia]), {
    nota: [notaServico, 'Prazo em dias úteis pela prioridade (alta 1, moderada 2, baixa 3), sem contar o dia do pedido, sábados, domingos e feriados; atendimento no último dia, em qualquer horário, está no prazo. Pela data da solicitação.']
      .filter(Boolean).join(' ')
  });

  // 4. Retornos dentro do prazo da justificativa
  var lRetSim = linhaCompilado('NO PRAZO');
  var lRetNao = linhaCompilado('FORA DO PRAZO');
  var lRetPct = linhaCompilado('% NO PRAZO', 'pct');
  lRetPct.num = lRetSim;
  lRetPct.den = [lRetSim, lRetNao];
  lRetPct.destaque = true;
  atend.forEach(function (a) {
    if (a.tipo_prazo !== 'RETORNO') return;
    var c = chave(a.data, a.unidade_id);
    if (a.no_prazo === 'SIM') acumular(lRetSim, c, 1);
    if (a.no_prazo === 'NÃO') acumular(lRetNao, c, 1);
  });
  secao('Retornos no prazo da justificativa', [lRetSim, lRetNao, lRetPct], {
    nota: 'Atendimentos de acompanhamento que contam para o prazo (ao paciente, à família ou aos dois).'
  });

  // 5. Desfechos no período, pelo histórico: conta todos, inclusive os que foram seguidos de retomada.
  var registrados = (dados.desfechosRegistrados || []).filter(function (d) { return aceita(d.data, d.unidade_id); });
  var chaveDesf = function (d) { return chave(d.data, d.unidade_id); };
  var linhasDesf = distribuicao(registrados, function (d) { return (desfechos[d.desfecho_id] || {}).nome; },
    (dados.desfechos || []).map(function (d) { return d.nome; }), chaveDesf);
  var lSaida = linhaCompilado('… saídas do hospital');
  var lSoAcomp = linhaCompilado('… só encerraram o acompanhamento');
  registrados.forEach(function (d) { acumular(d.encerra_admissao === 'SIM' ? lSaida : lSoAcomp, chaveDesf(d), 1); });
  secao('Desfechos', linhasDesf.concat([lSaida, lSoAcomp]), {
    nota: [notaServico, 'Conta todos os desfechos registrados: um paciente que teve alta psicológica, retomou e depois teve alta conta duas vezes.']
      .filter(Boolean).join(' ')
  });

  // 6. Atividades assistenciais e 7. reuniões de equipe
  var ativ = dados.atividades.filter(function (a) { return aceita(a.data, a.unidade_id) && noGrupo(a.categoria, grupo); });
  secao('Atividades assistenciais', distribuicao(ativ, function (a) { return a.tipo; }, listas.ATIVIDADE_ASSISTENCIAL,
    function (a) { return chave(a.data, a.unidade_id); }, qtd));
  var reun = dados.reunioes.filter(function (r) { return aceita(r.data, r.unidade_id) && noGrupo(r.categoria, grupo); });
  secao('Reuniões de equipe', distribuicao(reun, function (r) { return r.tipo; }, listas.REUNIAO_EQUIPE,
    function (r) { return chave(r.data, r.unidade_id); }, qtd));

  // 8. Atividades gerenciais: não têm unidade, então no mensal aparecem só com o total.
  var ger = dados.gerenciais.filter(function (g) { return noPeriodo(g.data) && noGrupo(g.categoria, grupo); });
  secao('Atividades gerenciais', distribuicao(ger, function (g) { return g.tipo; }, listas.ATIVIDADE_GERENCIAL,
    function (g) { return eixoUnidade ? '' : normalizarData(g.data).slice(5, 7); }, qtd),
  { semColunas: eixoUnidade, nota: eixoUnidade ? 'Não são ligadas a uma unidade; aparece só o total do mês.' : '' });

  // Colunas de unidades inativas só aparecem se tiverem algum número.
  var temValor = {};
  secoes.forEach(function (s) {
    s.linhas.forEach(function (l) { Object.keys(l.soma).forEach(function (k) { if (l.soma[k]) temValor[k] = true; }); });
  });
  colunas = colunas.filter(function (c) { return c.ativo || temValor[c.chave]; });

  secoes.forEach(function (s) {
    s.linhas = s.linhas.map(function (l) { return finalizarLinha(l, colunas); });
  });

  var periodo = mes ? MESES_NOME[Number(mes) - 1] + ' DE ' + ano : ano;
  return {
    titulo: (eixoUnidade ? 'COMPILADO ' : 'COMPILADO ANUAL ') + periodo,
    subtitulo: GRUPOS_COMPILADO[grupo] || grupo,
    colunas: colunas.map(function (c) { return { chave: c.chave, nome: c.nome }; }),
    secoes: secoes
  };
}

function finalizarLinha(l, colunas) {
  var valor = function (k) {
    if (l.tipo === 'pct') {
      var den = l.den.reduce(function (s, d) { return s + (d.soma[k] || 0); }, 0);
      return den ? (l.num.soma[k] || 0) / den : null;
    }
    if (l.tipo === 'media') return l.cont[k] ? l.soma[k] / l.cont[k] : null;
    return l.soma[k] || 0;
  };
  var somaTudo = function (obj) { return Object.keys(obj).reduce(function (s, k) { return s + obj[k]; }, 0); };
  var total;
  if (l.tipo === 'pct') {
    var den = l.den.reduce(function (s, d) { return s + somaTudo(d.soma); }, 0);
    total = den ? somaTudo(l.num.soma) / den : null;
  } else if (l.tipo === 'media') {
    var n = somaTudo(l.cont);
    total = n ? somaTudo(l.soma) / n : null;
  } else {
    total = somaTudo(l.soma);
  }
  return {
    rotulo: l.rotulo,
    tipo: l.tipo,
    destaque: Boolean(l.destaque),
    valores: colunas.map(function (c) { return valor(c.chave); }),
    total: total
  };
}

/** Texto de um valor do compilado: inteiro, percentual ou média com uma casa. */
function formatarValorCompilado(valor, tipo) {
  if (valor === null || valor === undefined) return '—';
  if (tipo === 'pct') return Math.round(valor * 100) + '%';
  if (tipo === 'media') return (Math.round(valor * 10) / 10).toString().replace('.', ',');
  return String(valor);
}

/** Compilado em linhas e colunas, para gravar numa planilha. */
function compiladoEmTabela(c) {
  var largura = c.colunas.length + 2;
  var vazia = function () { var l = []; for (var i = 0; i < largura; i++) l.push(''); return l; };
  var linhas = [];
  var tipos = [];
  var push = function (l, tipo) {
    while (l.length < largura) l.push('');
    linhas.push(l);
    tipos.push(tipo);
  };
  push([c.titulo], 'titulo');
  push([c.subtitulo], 'subtitulo');
  push(vazia(), 'vazia');
  c.secoes.forEach(function (s) {
    push([s.titulo.toUpperCase()].concat(s.semColunas ? [] : c.colunas.map(function (col) { return col.nome; })).concat(s.semColunas ? [] : ['TOTAL']), 'cabecalho');
    if (s.semColunas) linhas[linhas.length - 1][1] = 'TOTAL';
    s.linhas.forEach(function (l) {
      var valores = s.semColunas ? [] : l.valores.map(function (v) { return formatarValorCompilado(v, l.tipo); });
      var linha = [l.rotulo].concat(valores).concat([formatarValorCompilado(l.total, l.tipo)]);
      push(linha, l.destaque ? 'destaque' : 'linha');
    });
    if (s.nota) push([s.nota], 'nota');
    push(vazia(), 'vazia');
  });
  return { linhas: linhas, tipos: tipos, largura: largura };
}

// ===== PainelIndicadores.js =====
/** Indicadores assistenciais: percentuais e casos, separados da produção do compilado. */
function resumoIndicador_(itens) {
  var r = { total: itens.length, no_prazo: 0, fora_prazo: 0, em_andamento: 0,
    nao_se_aplica: 0, sem_prazo: 0, dados_pendentes: 0, fora_escopo: 0, atrasados_abertos: 0 };
  var campos = { 'SIM': 'no_prazo', 'NÃO': 'fora_prazo', 'EM ANDAMENTO': 'em_andamento',
    'NÃO SE APLICA': 'nao_se_aplica', 'SEM PRAZO': 'sem_prazo',
    'DADOS PENDENTES': 'dados_pendentes', 'FORA DO ESCOPO': 'fora_escopo' };
  itens.forEach(function (i) {
    if (campos[i.resultado]) r[campos[i.resultado]]++;
    if (i.resultado === 'NÃO' && !i.realizado && !i.encerrado) r.atrasados_abertos++;
  });
  r.avaliados = r.no_prazo + r.fora_prazo;
  r.percentual = r.avaliados ? r.no_prazo / r.avaliados : null;
  return r;
}

/** Função pura: datas ISO, grupos e uma obrigação por retorno, mesmo com vários contatos no dia. */
function montarPainelIndicadores(dados, op) {
  var mapas = function (lista) {
    var m = {};
    (lista || []).forEach(function (x) { m[x.id] = x; });
    return m;
  };
  var pacientes = mapas(dados.pacientes), unidades = mapas(dados.unidades);
  var justificativas = mapas(dados.justificativas), prioridades = mapas(dados.prioridades);
  var mes = String(op.ano) + '-' + doisDigitos(Number(op.mes));
  var feriados = conjuntoFeriados(dados.feriados || []);
  var agoraDh = op.agora, hojeIso = agoraDh.slice(0, 10);
  var primeiro = [], interconsultas = [], retornos = [];
  var admissoes = mapas(dados.admissoes);
  var atendimentos = {}, desfechos = {};
  (dados.atendimentos || []).forEach(function (a) {
    (atendimentos[a.admissao_id] = atendimentos[a.admissao_id] || []).push(a);
  });
  (dados.desfechos || []).forEach(function (d) {
    (desfechos[d.admissao_id] = desfechos[d.admissao_id] || []).push(normalizarData(d.data));
  });
  function aceita(adm, data, unidadeId) {
    if (normalizarData(data).slice(0, 7) !== mes) return false;
    var u = unidades[unidadeId] || {};
    if (op.setor_id && op.setor_id !== u.setor_id) return false;
    if (op.unidade_id && op.unidade_id !== unidadeId) return false;
    var p = pacientes[adm.paciente_id] || {};
    var termo = normalizarTexto(op.termo);
    return !termo || normalizarTexto(p.nome).indexOf(termo) !== -1 || String(p.prontuario || '') === normalizarProntuario(op.termo);
  }
  function caso(adm, unidadeId, campos) {
    var p = pacientes[adm.paciente_id] || {}, u = unidades[unidadeId] || {};
    return Object.assign({ admissao_id: adm.id, paciente_nome: p.nome || '', prontuario: p.prontuario || '',
      unidade_nome: u.nome || '', unidade_id: unidadeId }, campos);
  }
  function resultado(prazo, realizado, encerramento) {
    if (!prazo) return 'SEM PRAZO';
    if (realizado) return realizado <= prazo ? 'SIM' : 'NÃO';
    if (encerramento && encerramento <= prazo.slice(0, 10)) return 'NÃO SE APLICA';
    if (encerramento || (prazo.length > 10 ? agoraDh : hojeIso) > prazo) return 'NÃO';
    return 'EM ANDAMENTO';
  }
  (dados.admissoes || []).forEach(function (adm) {
    var contatos = (atendimentos[adm.id] || []).filter(function (a) {
      return contaParaPrazo(a) && normalizarData(a.data) && a.data <= hojeIso;
    }).slice().sort(function (a, b) {
      return String(a.data).localeCompare(String(b.data)) || String(a.hora || '').localeCompare(String(b.hora || '')) ||
        String(a.criado_em || '').localeCompare(String(b.criado_em || ''));
    });
    if (aceita(adm, adm.data_admissao, adm.unidade_id)) {
      var entrada = normalizarData(adm.data_admissao);
      var dataPrimeiro = contatos.length ? normalizarData(contatos[0].data) : normalizarData(adm.primeiro_atendimento);
      var prazoPrimeiro = adicionarDiasUteis(entrada, op.diasPrimeiro, feriados);
      var situacao = entrada < op.inicioPrimeiro ? 'FORA DO ESCOPO' :
        resultado(prazoPrimeiro, dataPrimeiro, normalizarData(adm.data_desfecho));
      if (!entrada || (dataPrimeiro && (dataPrimeiro < entrada || dataPrimeiro > hojeIso))) situacao = 'DADOS PENDENTES';
      primeiro.push(caso(adm, adm.unidade_id, { id: adm.id, referencia: entrada, prazo: prazoPrimeiro,
        realizado: dataPrimeiro, resultado: situacao, encerrado: Boolean(adm.desfecho_id), grupo: 'Todas as admissões' }));
    }

    // Um dia de atendimento abre um único próximo retorno. A justificativa daquele dia
    // define a obrigação histórica, mesmo quando a justificativa atual mudou.
    var dias = [];
    contatos.forEach(function (a) {
      if (dias.length && dias[dias.length - 1].data === a.data) dias[dias.length - 1] = a;
      else dias.push(a);
    });
    var retomada = normalizarData(adm.retomado_em);
    if (retomada && retomada <= hojeIso && !dias.some(function (a) { return a.data === retomada; })) {
      var apos = dias.filter(function (a) { return a.data > retomada; })[0];
      dias.push({ id: 'retomada_' + adm.id, data: retomada, unidade_id: adm.unidade_id,
        justificativa_id: apos ? apos.justificativa_id : adm.justificativa_id });
      dias.sort(function (a, b) { return a.data.localeCompare(b.data); });
    }
    var encerramentos = (desfechos[adm.id] || []).slice();
    if (adm.data_desfecho) encerramentos.push(normalizarData(adm.data_desfecho));
    encerramentos = encerramentos.filter(Boolean).sort();
    dias.forEach(function (origem, index) {
      var proximo = dias[index + 1];
      var fim = encerramentos.filter(function (d) {
        // Um desfecho antigo na própria data da retomada não encerra o novo ciclo.
        var anteriorARetomada = retomada && origem.data >= retomada && d <= retomada && d !== normalizarData(adm.data_desfecho);
        return d >= origem.data && !anteriorARetomada;
      })[0] || '';
      var realizado = proximo && (!fim || proximo.data <= fim) ? proximo.data : '';
      // Uma retomada é o começo de um novo ciclo, não a resposta ao retorno anterior.
      if (proximo && String(proximo.id).indexOf('retomada_') === 0) realizado = '';
      var atual = !proximo && !fim;
      var justificativaId = atual ? (adm.justificativa_id || origem.justificativa_id) : origem.justificativa_id;
      var j = justificativas[justificativaId] || {};
      var p = prioridades[j.prioridade_id] || {};
      var temPrazo = p.prazo !== '' && p.prazo !== undefined && !isNaN(Number(p.prazo));
      var prazo = temPrazo ? adicionarDiasUteis(origem.data, Number(p.prazo), feriados) : '';
      var referencia = prazo || origem.data;
      var unidadeId = origem.unidade_id || adm.unidade_id;
      if (!aceita(adm, referencia, unidadeId)) return;
      var r = !justificativaId ? 'DADOS PENDENTES' : resultado(prazo, realizado, fim);
      if (atual && SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) !== -1) r = 'NÃO SE APLICA';
      retornos.push(caso(adm, unidadeId, { id: origem.id, referencia: referencia, inicio: origem.data,
        prazo: prazo, prazo_dias: temPrazo ? Number(p.prazo) : null, realizado: realizado, resultado: r,
        encerrado: Boolean(fim), grupo: j.nome || 'Justificativa não informada', prioridade: p.nome || '' }));
    });
  });
  (dados.interconsultas || []).forEach(function (i) {
    var adm = admissoes[i.admissao_id];
    if (!adm || i.excluido_em || !aceita(adm, i.data_solicitacao, i.unidade_id)) return;
    interconsultas.push(caso(adm, i.unidade_id, { id: i.id, referencia: dataHora(i.data_solicitacao, i.hora_solicitacao),
      prazo: i.prazo_resposta || '', realizado: i.momento_resposta || '', resultado: i.resposta_no_prazo || 'DADOS PENDENTES',
      encerrado: !i.pendente && !i.momento_resposta, grupo: i.prioridade_solicitacao || 'Sem prioridade', motivo: i.motivo_nome || '' }));
  });
  function indicador(itens, criterio) {
    var grupos = {};
    itens.forEach(function (i) { (grupos[i.grupo] = grupos[i.grupo] || []).push(i); });
    itens.sort(function (a, b) {
      var ordem = { 'NÃO': 0, 'EM ANDAMENTO': 1, 'DADOS PENDENTES': 2, 'SIM': 3 };
      return (ordem[a.resultado] === undefined ? 4 : ordem[a.resultado]) - (ordem[b.resultado] === undefined ? 4 : ordem[b.resultado]) ||
        String(a.prazo).localeCompare(String(b.prazo));
    });
    return { resumo: resumoIndicador_(itens), criterio: criterio,
      grupos: Object.keys(grupos).sort().map(function (nome) { return { nome: nome, resumo: resumoIndicador_(grupos[nome]) }; }),
      casos: itens.slice(0, 300), total_casos: itens.length };
  }
  return { mes: mes, agora: agoraDh, inicio_primeiro: op.inicioPrimeiro, dias_primeiro: op.diasPrimeiro,
    primeiro: indicador(primeiro, 'Admissões no mês selecionado. Indicador válido para entradas a partir de ' + op.inicioPrimeiro + '.'),
    interconsultas: indicador(interconsultas, 'Solicitações feitas no mês selecionado. Prazo em dias úteis pela prioridade de cada solicitação (alta 1, moderada 2, baixa 3), sem contar o dia do pedido, sábados, domingos e feriados; vence no fim do dia.'),
    acompanhamento: indicador(retornos, 'Retornos cujo prazo vence no mês selecionado, em dias úteis pela justificativa do atendimento anterior. Cada intervalo conta uma vez.') };
}

function apiIndicadores(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var ano = Number(f.ano), mes = Number(f.mes);
    if (!Number.isInteger(ano) || ano < 2020 || ano > 2100 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      throw new Error('Selecione um mês e ano válidos.');
    }
    if (f.unidade_id && !buscarPorId('UNIDADES', f.unidade_id)) throw new Error('Unidade não encontrada.');
    if (f.setor_id && !buscarPorId('SETORES', f.setor_id)) throw new Error('Setor não encontrado.');
    return montarPainelIndicadores({ pacientes: listar('PACIENTES'), unidades: listar('UNIDADES'),
      admissoes: listar('ADMISSOES'), atendimentos: listar('ATENDIMENTOS'), interconsultas: listarInterconsultas_(),
      justificativas: listar('JUSTIFICATIVAS'), prioridades: listar('PRIORIDADES'),
      feriados: listar('FERIADOS'), desfechos: listar('DESFECHOS_REGISTRADOS') },
    { ano: ano, mes: mes, setor_id: f.setor_id || '', unidade_id: f.unidade_id || '', termo: f.termo || '',
      agora: agora(), diasPrimeiro: diasPrimeiroAtendimento(), inicioPrimeiro: APP.inicioIndicadorPrimeiro });
  });
}

// ===== Db.js =====
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

// ===== Setup.js =====
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

// ===== Main.js =====
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
  var r = apiInicio(true);
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

// ===== Api.js =====
/**
 * Funções chamadas pela tela via google.script.run.
 * Todas passam por responder() e conferem o acesso do usuário.
 */

function porOrdem(a, b) {
  return Number(a.ordem || 0) - Number(b.ordem || 0);
}

/** Tudo o que a tela precisa para abrir: usuário, listas, setores, unidades e profissionais. */
function apiInicio(incluirPainel) {
  return responder(function () {
    var usuario = usuarioAtual();
    var dados = Object.assign({ usuario: usuario }, dadosDeCadastro(usuario.perfil === 'COORDENAÇÃO'));
    if (incluirPainel === true) dados.painel = dadosDeGestao_({});
    return dados;
  });
}

function dadosDeCadastro(incluirInativos) {
  var ativo = function (x) { return incluirInativos || x.ativo === 'SIM'; };
  var listas = {};
  listar('LISTAS').filter(ativo).sort(porOrdem).forEach(function (item) {
    (listas[item.lista] = listas[item.lista] || []).push(item);
  });
  var setores = listar('SETORES').filter(ativo).sort(porOrdem);
  var nomeSetor = {};
  setores.forEach(function (s) { nomeSetor[s.id] = s.nome; });
  var unidades = listar('UNIDADES').filter(ativo).sort(porOrdem).map(function (u) {
    return Object.assign({ setor: nomeSetor[u.setor_id] || '' }, u);
  });
  var profissionais = listar('PROFISSIONAIS').filter(ativo).sort(function (a, b) {
    return String(a.nome).localeCompare(String(b.nome));
  });
  var dados = {
    listas: listas,
    setores: setores,
    unidades: unidades,
    profissionais: profissionais,
    justificativas: listar('JUSTIFICATIVAS').filter(ativo).sort(porOrdem),
    motivos: listar('MOTIVOS_SOLICITACAO').filter(ativo).sort(porOrdem),
    prioridades: listar('PRIORIDADES').filter(ativo).sort(porOrdem),
    tipos_prioridade: TIPOS_PRIORIDADE,
    para_quem: PARA_QUEM_SOLICITACAO,
    agora: agora(),
    desfechos: listar('DESFECHOS').filter(ativo).sort(porOrdem),
    parametros: listar('PARAMETROS'),
    status_admissao: STATUS_ADMISSAO,
    grupos: GRUPOS_COMPILADO,
    feriados: listar('FERIADOS').slice().sort(function (a, b) { return a.data < b.data ? -1 : 1; }),
    categorias: CATEGORIAS_PROFISSIONAL,
    perfis: PERFIS,
    publicos: PUBLICOS_ATENDIMENTO,
    sexos_paciente: SEXOS_PACIENTE,
    tipos_atendimento: TIPOS_ATENDIMENTO,
    inicio_indicador_primeiro: APP.inicioIndicadorPrimeiro,
    hoje: hoje()
  };
  return dados;
}

// ---------- Pacientes ----------

/** Lista a página de pacientes, inclusive quando não há termo de busca. */
function apiListarPacientes(filtros) {
  return responder(function () {
    usuarioAtual();
    filtros = filtros || {};
    var termo = String(filtros.termo || '').trim();
    var pacientes = listar('PACIENTES');
    pacientes = termo ? filtrarPacientes(pacientes, termo, pacientes.length) : pacientes.slice();
    pacientes.sort(function (a, b) {
      return normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome))
        || String(a.prontuario).localeCompare(String(b.prontuario))
        || String(a.id).localeCompare(String(b.id));
    });
    var tamanho = 20;
    var total = pacientes.length;
    var paginas = Math.max(1, Math.ceil(total / tamanho));
    var pagina = Number(filtros.pagina);
    if (!isFinite(pagina) || pagina < 1) pagina = 1;
    pagina = Math.min(paginas, Math.floor(pagina));
    return {
      pacientes: pacientes.slice((pagina - 1) * tamanho, pagina * tamanho),
      pagina: pagina,
      paginas: paginas,
      total: total,
      tamanho_pagina: tamanho
    };
  });
}

function apiBuscarPacientes(termo) {
  return responder(function () {
    usuarioAtual();
    return filtrarPacientes(listar('PACIENTES'), termo, 20);
  });
}

function apiSalvarPaciente(dados) {
  return responderGravando(function () {
    usuarioAtual();
    var paciente = {
      id: dados.id || '',
      prontuario: normalizarProntuario(dados.prontuario),
      nome: formatarNome(dados.nome)
    };
    if (!paciente.prontuario) throw new Error('Informe o prontuário (somente números).');
    if (!paciente.nome) throw new Error('Informe o nome do paciente.');
    if (Object.prototype.hasOwnProperty.call(dados, 'sexo')) {
      paciente.sexo = String(dados.sexo || '').trim().toUpperCase();
      if (paciente.sexo && SEXOS_PACIENTE.indexOf(paciente.sexo) === -1) throw new Error('Selecione um sexo válido.');
    }
    if (Object.prototype.hasOwnProperty.call(dados, 'data_nascimento')) {
      var nascimento = String(dados.data_nascimento || '').trim();
      paciente.data_nascimento = normalizarData(nascimento);
      if (nascimento && (!/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})$/.test(nascimento) || !paciente.data_nascimento)) {
        throw new Error('Data de nascimento inválida.');
      }
      if (paciente.data_nascimento > hoje()) throw new Error('A data de nascimento não pode estar no futuro.');
    }
    var duplicado = acharDuplicado(listar('PACIENTES'), paciente);
    if (duplicado) throw new Error('Já existe paciente com o prontuário ' + paciente.prontuario + ': ' + duplicado.nome + '.');
    if (paciente.id) return atualizar('PACIENTES', paciente.id, paciente);
    return inserir('PACIENTES', paciente);
  });
}

// ---------- Cadastros da coordenação ----------

function apiSalvarProfissional(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var prof = {
      nome: formatarNome(dados.nome),
      email: String(dados.email || '').trim().toLowerCase(),
      categoria: dados.categoria,
      perfil: dados.perfil,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!prof.nome) throw new Error('Informe o nome.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(prof.email)) throw new Error('Informe um e-mail Google válido.');
    if (CATEGORIAS_PROFISSIONAL.indexOf(prof.categoria) === -1) throw new Error('Escolha a categoria.');
    if (PERFIS.indexOf(prof.perfil) === -1) throw new Error('Escolha o perfil.');
    var mesmoEmail = listar('PROFISSIONAIS').filter(function (p) {
      return p.email === prof.email && p.id !== dados.id;
    })[0];
    if (mesmoEmail) throw new Error('Este e-mail já está cadastrado para ' + mesmoEmail.nome + '.');
    if (dados.id) atualizar('PROFISSIONAIS', dados.id, prof);
    else inserir('PROFISSIONAIS', prof);
    return dadosDeCadastro(true);
  });
}

function apiSalvarSetor(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var setor = { nome: formatarNome(dados.nome), ordem: Number(dados.ordem) || 99, ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM' };
    if (!setor.nome) throw new Error('Informe o nome do setor.');
    if (dados.id) atualizar('SETORES', dados.id, setor);
    else inserir('SETORES', setor);
    return dadosDeCadastro(true);
  });
}

function apiSalvarUnidade(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var unidade = {
      nome: formatarNome(dados.nome),
      setor_id: dados.setor_id,
      ordem: Number(dados.ordem) || 99,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!unidade.nome) throw new Error('Informe o nome da unidade.');
    if (!buscarPorId('SETORES', unidade.setor_id)) throw new Error('Escolha o setor da unidade.');
    if (dados.id) atualizar('UNIDADES', dados.id, unidade);
    else inserir('UNIDADES', unidade);
    return dadosDeCadastro(true);
  });
}

function apiSalvarItemLista(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    if (!LISTAS_INICIAIS[dados.lista]) throw new Error('Lista desconhecida.');
    var item = {
      lista: dados.lista,
      valor: formatarNome(dados.valor),
      ordem: Number(dados.ordem) || 99,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!item.valor) throw new Error('Informe o valor.');
    if (dados.id) atualizar('LISTAS', dados.id, item);
    else inserir('LISTAS', item);
    return dadosDeCadastro(true);
  });
}

function validarPrioridadeDoTipo(prioridadeId, tipo) {
  if (!prioridadeId) return '';
  var p = buscarPorId('PRIORIDADES', prioridadeId);
  if (!p || p.tipo !== tipo) throw new Error('Prioridade inválida.');
  return p.id;
}

/** Justificativa de acompanhamento ligada a uma prioridade de seguimento (sem prioridade = sem prazo). */
function apiSalvarJustificativa(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var item = {
      nome: formatarNome(dados.nome),
      prioridade_id: validarPrioridadeDoTipo(dados.prioridade_id, TIPOS_PRIORIDADE.seguimento),
      ordem: Number(dados.ordem) || 99,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!item.nome) throw new Error('Informe a justificativa.');
    if (dados.id) atualizar('JUSTIFICATIVAS', dados.id, item);
    else inserir('JUSTIFICATIVAS', item);
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

/** Motivo da solicitação ligado a uma prioridade de solicitação (sem prioridade = sem prazo). */
function apiSalvarMotivo(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var item = {
      nome: formatarNome(dados.nome),
      prioridade_id: validarPrioridadeDoTipo(dados.prioridade_id, TIPOS_PRIORIDADE.solicitacao),
      ordem: Number(dados.ordem) || 99,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!item.nome) throw new Error('Informe o motivo.');
    if (dados.id) atualizar('MOTIVOS_SOLICITACAO', dados.id, item);
    else inserir('MOTIVOS_SOLICITACAO', item);
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

/** Prioridade de solicitação ou de seguimento; as duas com prazo em dias úteis (v27). */
function apiSalvarPrioridade(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var tipos = [TIPOS_PRIORIDADE.solicitacao, TIPOS_PRIORIDADE.seguimento];
    var atual = dados.id ? buscarPorId('PRIORIDADES', dados.id) : null;
    var tipo = atual ? atual.tipo : dados.tipo;
    if (tipos.indexOf(tipo) === -1) throw new Error('Escolha se a prioridade é de solicitação ou de seguimento.');
    var prazo = String(dados.prazo === undefined ? '' : dados.prazo).trim();
    if (!/^\d+$/.test(prazo) || Number(prazo) < 1) {
      throw new Error('O prazo deve ser um número inteiro de dias úteis.');
    }
    var item = {
      tipo: tipo,
      nome: formatarNome(dados.nome),
      prazo: prazo,
      periodicidade: String(dados.periodicidade || '').trim(),
      ordem: Number(dados.ordem) || 99,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!item.nome) throw new Error('Informe o nome da prioridade.');
    if (atual) atualizar('PRIORIDADES', atual.id, item);
    else inserir('PRIORIDADES', item);
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

function apiSalvarFeriado(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var feriado = { data: normalizarData(dados.data), descricao: formatarNome(dados.descricao) };
    if (!feriado.data) throw new Error('Informe a data do feriado.');
    var repetido = listar('FERIADOS').filter(function (f) { return f.data === feriado.data && f.id !== dados.id; })[0];
    if (repetido) throw new Error('Esta data já está cadastrada: ' + repetido.descricao + '.');
    if (dados.id) atualizar('FERIADOS', dados.id, feriado);
    else inserir('FERIADOS', feriado);
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

function apiExcluirFeriado(id) {
  return responderGravando(function () {
    exigirCoordenacao();
    excluir('FERIADOS', id);
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

function apiSalvarDesfecho(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var item = {
      nome: formatarNome(dados.nome),
      encerra_admissao: dados.encerra_admissao === 'SIM' ? 'SIM' : 'NÃO',
      ordem: Number(dados.ordem) || 99,
      ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM'
    };
    if (!item.nome) throw new Error('Informe o desfecho.');
    if (dados.id) atualizar('DESFECHOS', dados.id, item);
    else inserir('DESFECHOS', item);
    recalcularAdmissoes(listar('ADMISSOES').filter(function (a) { return a.desfecho_id; }).map(function (a) { return a.id; }));
    var mudancas = {};
    listar('DESFECHOS_REGISTRADOS').forEach(function (r) {
      var d = buscarPorId('DESFECHOS', r.desfecho_id);
      if (d && d.encerra_admissao !== r.encerra_admissao) mudancas[r.id] = { encerra_admissao: d.encerra_admissao };
    });
    atualizarVarios('DESFECHOS_REGISTRADOS', mudancas);
    return dadosDeCadastro(true);
  });
}

function apiSalvarParametro(dados) {
  return responderGravando(function () {
    exigirCoordenacao();
    var param = listar('PARAMETROS').filter(function (p) { return p.id === dados.id; })[0];
    if (!param) throw new Error('Parâmetro não encontrado.');
    var valor = String(dados.valor === undefined ? '' : dados.valor).trim();
    if (param.chave === 'PRAZO_PRIMEIRO_ATENDIMENTO_DIAS_UTEIS' && !/^\d+$/.test(valor)) {
      throw new Error('O prazo deve ser um número inteiro de dias úteis.');
    }
    if (param.chave === 'TIPOS_SOLICITACAO_COM_PRAZO') {
      var tipos = listar('LISTAS').filter(function (i) { return i.lista === 'TIPO_SOLICITACAO'; }).map(function (i) { return i.valor; });
      var escolhidos = valor.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      escolhidos.forEach(function (t) { if (tipos.indexOf(t) === -1) throw new Error('Tipo de solicitação desconhecido: ' + t + '.'); });
      valor = escolhidos.join(',');
    }
    atualizar('PARAMETROS', param.id, { valor: valor });
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

// ===== Admissoes.js =====
/**
 * Admissões (cada entrada do paciente no hospital), atendimentos e atividades assistenciais.
 */

var CAMPOS_ADMISSAO_EDITAVEIS = [
  'paciente_id', 'data_admissao', 'unidade_id', 'tipo_solicitacao', 'motivo_solicitacao_id', 'data_solicitacao',
  'hora_solicitacao', 'para_quem', 'familiar_nome', 'familiar_parentesco', 'descricao_demanda',
  'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'observacoes'
];
var CAMPOS_DATA_ADMISSAO = ['data_admissao', 'data_solicitacao', 'data_desfecho'];
var CAMPOS_ENTRADA_ADMISSAO = [
  'paciente_id', 'data_admissao', 'unidade_id', 'observacoes'
];
var CAMPOS_ACOMPANHAMENTO = ['descricao_demanda', 'necessidade_acompanhamento', 'justificativa_id'];

/** Salva somente a parte exibida pela tela, preservando os demais dados da internação. */
function salvarCamposAdmissao_(dados, campos, exigirExistente, exigirAcompanhamentoAtivo) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    if (exigirExistente && !dados.id) throw new Error('Informe a admissão.');
    var atual = dados.id ? buscarPorId('ADMISSOES', dados.id) : null;
    if (dados.id && !atual) throw new Error('Admissão não encontrada.');
    if (exigirAcompanhamentoAtivo) admissaoParaRegistro(dados.id);
    if (atual && campos.indexOf('paciente_id') !== -1 && dados.paciente_id && dados.paciente_id !== atual.paciente_id) {
      throw new Error('O paciente de uma admissão existente não pode ser trocado.');
    }
    var combinado = Object.assign({}, atual || {}, { id: atual ? atual.id : '' });
    campos.forEach(function (c) {
      if (Object.prototype.hasOwnProperty.call(dados, c)) combinado[c] = dados[c];
    });
    if (exigirAcompanhamentoAtivo && combinado.justificativa_id && !buscarPorId('JUSTIFICATIVAS', combinado.justificativa_id)) {
      throw new Error('Justificativa não encontrada.');
    }
    return salvarAdmissao_(combinado, usuario, true);
  });
}

/** Entrada hospitalar: não altera demanda, acompanhamento ou desfecho. */
function apiSalvarEntradaAdmissao(dados) {
  return salvarCamposAdmissao_(dados, CAMPOS_ENTRADA_ADMISSAO, false, false);
}

/** Dados clínicos editados na tela Atendimentos. */
function apiSalvarAcompanhamento(dados) {
  return salvarCamposAdmissao_(dados, CAMPOS_ACOMPANHAMENTO, true, true);
}

/** Corrige só a descrição da demanda, em qualquer momento da internação (v27). */
/** Registra ou corrige o desfecho da admissão escolhida, mantendo seu histórico. */
function apiSalvarDesfechoAdmissao(dados) {
  return salvarCamposAdmissao_(dados, ['desfecho_id', 'data_desfecho'], true, false);
}

function mapaPorId(nome) {
  var mapa = {};
  listar(nome).forEach(function (x) { mapa[x.id] = x; });
  return mapa;
}

/** Prioridade ativa ligada a um motivo ou justificativa (ou null). */
function prioridadeDe(registro) {
  if (!registro || !registro.prioridade_id) return null;
  var p = buscarPorId('PRIORIDADES', registro.prioridade_id);
  return p && p.ativo !== 'NÃO' ? p : null;
}

/**
 * Prioridade da matriz de atendimento com o prazo em dias úteis (v27: alta 1, moderada 2, baixa 3).
 * Bancos de antes da v27 guardavam horas (24/48/72): até o "configurar" converter, 24h = 1 dia útil.
 */
function prioridadeSolicitacaoEmDias_(p) {
  if (!p || p.prazo === '' || isNaN(Number(p.prazo))) return p;
  var n = Number(p.prazo);
  if (parametro('PRAZO_SOLICITACAO_EM_DIAS', '') !== 'SIM' && n >= 24) n = Math.ceil(n / 24);
  return Object.assign({}, p, { prazo: String(n) });
}

/** { justificativa_id: dias úteis } pela prioridade de seguimento de cada justificativa. */
function prazosPorJustificativa() {
  var prazos = {};
  listar('JUSTIFICATIVAS').forEach(function (j) {
    var p = prioridadeDe(j);
    prazos[j.id] = p ? p.prazo : '';
  });
  return prazos;
}

function tiposSolicitacaoComPrazo() {
  return String(parametro('TIPOS_SOLICITACAO_COM_PRAZO', 'EQUIPE')).split(',')
    .map(function (t) { return t.trim(); }).filter(Boolean);
}

/** Valor de um parâmetro (aba PARAMETROS), com valor padrão se não existir. */
function parametro(chave, padrao) {
  var p = listar('PARAMETROS').filter(function (x) { return x.chave === chave; })[0];
  return p && p.valor !== '' ? p.valor : padrao;
}

function diasPrimeiroAtendimento() {
  var n = Number(parametro('PRAZO_PRIMEIRO_ATENDIMENTO_DIAS_UTEIS', 3));
  return isNaN(n) || n < 0 ? 3 : n;
}

function desfechoEncerraAdmissao(desfechoId) {
  var d = buscarPorId('DESFECHOS', desfechoId);
  return Boolean(d) && d.encerra_admissao === 'SIM';
}

/** Recalcula status, 1º atendimento e prazos da admissão e de seus atendimentos, e grava o que mudou. */
function recalcularAdmissao(id) {
  recalcularAdmissoes([id]);
  return buscarPorId('ADMISSOES', id);
}

function recalcularAdmissoes(ids) {
  var op = {
    prazos: prazosPorJustificativa(),
    feriados: conjuntoFeriados(listar('FERIADOS')),
    diasPrimeiro: diasPrimeiroAtendimento(),
    hoje: hoje()
  };
  var tipos = tiposSolicitacaoComPrazo();
  var momento = agora();
  var atendimentos = listar('ATENDIMENTOS');
  var mudancasAdm = {};
  var mudancasAtend = {};
  ids.forEach(function (id) {
    var adm = buscarPorId('ADMISSOES', id);
    if (!adm) return;
    var daAdmissao = atendimentos.filter(function (a) { return a.admissao_id === id; });
    var r = calcularAdmissao(adm, daAdmissao, Object.assign({ desfechoEncerra: desfechoEncerraAdmissao(adm.desfecho_id) }, op));
    var resposta = calcularResposta(adm, daAdmissao, {
      prioridade: prioridadeSolicitacaoEmDias_(prioridadeDe(buscarPorId('MOTIVOS_SOLICITACAO', adm.motivo_solicitacao_id))),
      tiposComPrazo: tipos,
      feriados: op.feriados,
      agora: momento
    });
    Object.assign(r.campos, resposta);
    var prioridadeSeguimento = prioridadeDe(buscarPorId('JUSTIFICATIVAS', adm.justificativa_id));
    r.campos.prioridade_demanda = prioridadeSeguimento ? prioridadeSeguimento.nome : '';
    if (Object.keys(r.campos).some(function (c) { return String(adm[c]) !== String(r.campos[c]); })) mudancasAdm[id] = r.campos;
    daAdmissao.forEach(function (a) {
      var novo = r.porAtendimento[a.id];
      var mudou = Object.keys(novo).some(function (c) { return String(a[c]) !== String(novo[c]); });
      if (mudou) {
        mudancasAtend[a.id] = novo;
      }
    });
  });
  atualizarVarios('ADMISSOES', mudancasAdm);
  atualizarVarios('ATENDIMENTOS', mudancasAtend);
}

/** Usado quando muda um prazo, um feriado ou um desfecho: recalcula as admissões não encerradas. */
function recalcularAdmissoesAbertas() {
  recalcularAdmissoes(listar('ADMISSOES').filter(function (a) { return a.status !== STATUS_ADMISSAO.encerrada; })
    .map(function (a) { return a.id; }));
}

function auxiliares() {
  var interconsultas = listarInterconsultas_();
  var transferencias = listarTransferencias_();
  return {
    feriados: conjuntoFeriados(listar('FERIADOS')),
    transferencias: transferencias,
    transferenciasPorAdmissao: agruparPor_(transferencias, 'admissao_id'),
    setores: mapaPorId('SETORES'),
    interconsultas: interconsultas,
    interconsultasPorAdmissao: agruparPor_(interconsultas, 'admissao_id'),
    descricoesPorAdmissao: agruparPor_(listar('DESCRICOES_DEMANDA'), 'admissao_id'),
    pacientes: mapaPorId('PACIENTES'),
    unidades: mapaPorId('UNIDADES'),
    justificativas: mapaPorId('JUSTIFICATIVAS'),
    motivos: mapaPorId('MOTIVOS_SOLICITACAO'),
    desfechos: mapaPorId('DESFECHOS'),
    profissionais: mapaPorId('PROFISSIONAIS'),
    hoje: hoje(),
    agora: agora()
  };
}

/** Admissão com os nomes que a tela mostra e a situação do próximo prazo. */
function resumoAdmissao(adm, aux) {
  var solicitacoes = aux.interconsultasPorAdmissao ? (aux.interconsultasPorAdmissao[adm.id] || []) :
    aux.interconsultas.filter(function (i) { return i.admissao_id === adm.id; });
  var pendentes = solicitacoes.filter(function (i) { return i.pendente; }).sort(function (a, b) {
    return String(a.prazo_resposta || '9999').localeCompare(String(b.prazo_resposta || '9999'));
  });
  var destaque = pendentes[0] || solicitacoes[solicitacoes.length - 1];
  adm = Object.assign({}, adm);
  ['prioridade_solicitacao', 'prazo_resposta', 'momento_resposta', 'dias_resposta', 'horas_resposta', 'resposta_no_prazo'].forEach(function (c) {
    adm[c] = destaque ? destaque[c] : '';
  });
  adm.interconsultas_pendentes = pendentes.length;
  var paciente = aux.pacientes[adm.paciente_id] || {};
  var unidade = aux.unidades[adm.unidade_id] || {};
  var unidadeAtualId = unidadeNaData_(adm, aux.hoje, aux.agora.slice(11),
    aux.transferenciasPorAdmissao ? (aux.transferenciasPorAdmissao[adm.id] || []) : aux.transferencias);
  var unidadeAtual = aux.unidades[unidadeAtualId] || {};
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var desfecho = aux.desfechos[adm.desfecho_id] || {};
  var motivo = aux.motivos[adm.motivo_solicitacao_id] || {};
  // Aguardando resposta à solicitação: o prazo dela também entra na situação.
  var aguardandoResposta = pendentes.length > 0;
  var situacaoResposta = aguardandoResposta ? situacaoPrazo(adm.prazo_resposta, aux.hoje, aux.feriados) : '';
  var situacaoRetorno = adm.proximo_prazo ? situacaoPrazo(adm.proximo_prazo, aux.hoje, aux.feriados) : '';
  return Object.assign({}, adm, {
    paciente_nome: paciente.nome || '',
    prontuario: paciente.prontuario || '',
    unidade_nome: unidade.nome || '',
    unidade_admissao_nome: unidade.nome || '',
    primeiro_em_avaliacao: Boolean(normalizarData(adm.data_admissao) && normalizarData(adm.data_admissao) >= APP.inicioIndicadorPrimeiro),
    unidade_atual_id: unidadeAtualId,
    unidade_atual_nome: unidadeAtual.nome || '',
    setor_atual_id: unidadeAtual.setor_id || '',
    setor_atual_nome: (aux.setores[unidadeAtual.setor_id] || {}).nome || '',
    setor_id: unidade.setor_id || '',
    justificativa_nome: justificativa.nome || '',
    desfecho_nome: desfecho.nome || '',
    motivo_nome: motivo.nome || '',
    aguardando_resposta: aguardandoResposta,
    aberta: adm.status !== STATUS_ADMISSAO.encerrada,
    situacao: situacaoMaisUrgente(situacaoResposta, situacaoRetorno)
  });
}

var ORDEM_SITUACAO = { 'ATRASADO': 0, 'VENCE HOJE': 1, 'VENCE AMANHÃ': 2, 'NO PRAZO': 3, '': 4 };

/**
 * Admissões filtradas.
 * filtros: { abertas: 'SIM'|'NÃO'|'', status, unidade_id, setor_id, situacao, termo (nome ou prontuário) }
 */
function apiListarAdmissoes(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var aux = auxiliares();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var lista = listar('ADMISSOES').map(function (a) { return resumoAdmissao(a, aux); }).filter(function (a) {
      if (f.abertas === 'SIM' && !a.aberta) return false;
      if (f.abertas === 'NÃO' && a.aberta) return false;
      if (f.status && a.status !== f.status) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.situacao && a.situacao !== f.situacao) return false;
      if (termo && normalizarTexto(a.paciente_nome).indexOf(termo) === -1 &&
        !(prontuario && normalizarProntuario(a.prontuario) === prontuario)) return false;
      return true;
    });
    lista.sort(function (a, b) {
      var s = ORDEM_SITUACAO[a.situacao] - ORDEM_SITUACAO[b.situacao];
      if (s) return s;
      var pa = a.proximo_prazo || '9999';
      var pb = b.proximo_prazo || '9999';
      if (pa !== pb) return pa < pb ? -1 : 1;
      return String(b.data_admissao).localeCompare(String(a.data_admissao));
    });
    return lista.slice(0, Number(f.limite) || 300);
  });
}

function apiObterAdmissao(id) {
  return responder(function () {
    usuarioAtual();
    var adm = buscarPorId('ADMISSOES', id);
    if (!adm) throw new Error('Admissão não encontrada.');
    return detalheAdmissao(adm);
  });
}

/** Apresentação do prazo clínico; o resultado da interconsulta tem seu próprio vínculo e prazo. */
function prazoClinicoNoHistorico_(adm, atendimento) {
  var p = { tipo: atendimento.tipo_prazo || '', prazo: atendimento.prazo_limite || '', resultado: atendimento.no_prazo || 'NÃO AVALIADO' };
  if (p.tipo === 'PRIMEIRO' && !normalizarData(adm.data_admissao)) {
    p.prazo = '';
    p.resultado = 'NÃO AVALIADO';
  } else if (p.tipo === 'PRIMEIRO' && normalizarData(adm.data_admissao) < APP.inicioIndicadorPrimeiro) {
    p.prazo = '';
    p.resultado = 'FORA DO ESCOPO';
  } else if (atendimento.conta_prazo === 'NÃO') {
    p.prazo = '';
    p.resultado = 'NÃO CONTA';
  } else if (!p.prazo) {
    p.resultado = p.tipo ? 'SEM PRAZO' : 'NÃO AVALIADO';
  }
  return p;
}

function detalheAdmissao(adm, auxPronto, semOutras) {
  var aux = auxPronto || auxiliares();
  var solicitacoes = aux.interconsultasPorAdmissao[adm.id] || [];
  var respostas = agruparPor_(solicitacoes, 'atendimento_resposta_id');
  var nomeProf = function (pid) { return (aux.profissionais[pid] || {}).nome || ''; };
  var porData = function (a, b) {
    return String(b.data).localeCompare(String(a.data)) || String(b.hora || '').localeCompare(String(a.hora || '')) ||
      String(b.criado_em).localeCompare(String(a.criado_em));
  };
  var daAdmissao = function (tabela) {
    return listar(tabela).filter(function (a) { return a.admissao_id === adm.id; }).sort(porData)
      .map(function (a) {
        var item = Object.assign({ profissional_nome: nomeProf(a.profissional_id), unidade_nome: (aux.unidades[a.unidade_id] || {}).nome || '',
          justificativa_nome: (aux.justificativas[a.justificativa_id] || {}).nome || '' }, a);
        if (tabela === 'ATENDIMENTOS') {
          item.prazo_acompanhamento = prazoClinicoNoHistorico_(adm, a);
          item.interconsultas_respondidas = (respostas[a.id] || []).map(function (i) {
            return { id: i.id, prioridade_solicitacao: i.prioridade_solicitacao, prazo_resposta: i.prazo_resposta,
              resposta_no_prazo: i.resposta_no_prazo, momento_resposta: i.momento_resposta, dias_resposta: i.dias_resposta,
              horas_resposta: i.horas_resposta };
          });
        }
        return item;
      });
  };
  var anteriores = semOutras ? [] : listar('ADMISSOES').filter(function (a) { return a.paciente_id === adm.paciente_id && a.id !== adm.id; })
    .map(function (a) { return resumoAdmissao(a, aux); })
    .sort(function (a, b) { return String(b.data_admissao).localeCompare(String(a.data_admissao)); });
  return {
    admissao: resumoAdmissao(adm, aux),
    paciente: aux.pacientes[adm.paciente_id] || null,
    transferencias: transferenciasDaAdmissao_(adm, aux.transferenciasPorAdmissao[adm.id] || []).map(function (t) {
      return Object.assign({}, t, { origem_nome: (aux.unidades[t.origem_unidade_id] || {}).nome || '',
        destino_nome: (aux.unidades[t.destino_unidade_id] || {}).nome || '', profissional_nome: nomeProf(t.criado_por) });
    }),
    interconsultas: solicitacoes,
    descricoes: descricoesDaAdmissao_(adm, aux.descricoesPorAdmissao[adm.id] || []).map(function (d) {
      return Object.assign({ unidade_nome: (aux.unidades[d.unidade_id] || {}).nome || '', profissional_nome: nomeProf(d.profissional_id) }, d);
    }),
    atendimentos: daAdmissao('ATENDIMENTOS'),
    atividades: daAdmissao('ATIVIDADES'),
    desfechos: listar('DESFECHOS_REGISTRADOS').filter(function (d) { return d.admissao_id === adm.id; })
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)) || String(a.criado_em).localeCompare(String(b.criado_em)); })
      .map(function (d) {
        return Object.assign({ desfecho_nome: (aux.desfechos[d.desfecho_id] || {}).nome || '', unidade_nome: (aux.unidades[d.unidade_id] || {}).nome || '' }, d);
      }),
    outras_admissoes: anteriores
  };
}

function apiSalvarAdmissao(dados) {
  return responderGravando(function () {
    return salvarAdmissao_(dados, usuarioAtual());
  });
}

/** Gravação comum às telas e à API completa, mantida para compatibilidade. */
function salvarAdmissao_(dados, usuario, permitirJustificativaPendente) {
  var adm = {};
  CAMPOS_ADMISSAO_EDITAVEIS.forEach(function (c) {
    var v = dados[c] === undefined || dados[c] === null ? '' : String(dados[c]).trim();
    adm[c] = CAMPOS_DATA_ADMISSAO.indexOf(c) !== -1 ? normalizarData(v) : v;
  });
  adm.hora_solicitacao = normalizarHora(adm.hora_solicitacao);
  adm.para_quem = adm.para_quem === 'FAMILIAR' ? 'FAMILIAR' : 'PACIENTE';
  if (adm.para_quem === 'PACIENTE') { adm.familiar_nome = ''; adm.familiar_parentesco = ''; }
  adm.familiar_nome = formatarNome(adm.familiar_nome);
  adm.familiar_parentesco = formatarNome(adm.familiar_parentesco);
  var atual = dados.id ? buscarPorId('ADMISSOES', dados.id) : null;
  if (dados.id && !atual) throw new Error('Admissão não encontrada.');

  var erros = validarAdmissao(adm, hoje(), permitirJustificativaPendente);
  if (dados.hora_solicitacao && !adm.hora_solicitacao) erros.push('Hora da solicitação inválida.');
  if (adm.hora_solicitacao && dataHora(adm.data_solicitacao, adm.hora_solicitacao) > agora()) {
    erros.push('A solicitação não pode estar no futuro.');
  }
  if (adm.motivo_solicitacao_id && !buscarPorId('MOTIVOS_SOLICITACAO', adm.motivo_solicitacao_id)) {
    erros.push('Motivo da solicitação não encontrado.');
  }
  if (adm.paciente_id && !buscarPorId('PACIENTES', adm.paciente_id)) erros.unshift('Paciente não encontrado.');
  if (adm.unidade_id && !buscarPorId('UNIDADES', adm.unidade_id)) erros.push('Unidade não encontrada.');
  if (adm.desfecho_id && !buscarPorId('DESFECHOS', adm.desfecho_id)) erros.push('Desfecho não encontrado.');
  var primeiroAtend = atual ? atual.primeiro_atendimento : '';
  if (primeiroAtend && adm.data_admissao > primeiroAtend) erros.push('A admissão não pode ser depois do 1º atendimento.');
  var ultimoAtend = listar('ATENDIMENTOS').filter(function (a) { return atual && a.admissao_id === atual.id; })
    .reduce(function (m, a) { return a.data > m ? a.data : m; }, '');
  if (adm.data_desfecho && atual && atual.retomado_em && adm.data_desfecho < normalizarData(atual.retomado_em)) {
    erros.push('O desfecho não pode ser antes da retomada do acompanhamento.');
  }
  if (adm.data_desfecho && ultimoAtend && adm.data_desfecho < ultimoAtend) {
    erros.push('O desfecho não pode ser antes do último atendimento (' + ultimoAtend.split('-').reverse().join('/') + ').');
  }
  if (atual) listarInterconsultas_().filter(function (i) { return i.admissao_id === atual.id; }).forEach(function (i) {
    if (adm.data_admissao > i.data_solicitacao) erros.push('A admissão não pode ser depois de uma interconsulta.');
    if (adm.data_desfecho && desfechoEncerraAdmissao(adm.desfecho_id) && adm.data_desfecho < i.data_solicitacao) {
      erros.push('A saída do hospital não pode ser antes de uma interconsulta.');
    }
  });
  var outraAberta = listar('ADMISSOES').filter(function (a) {
    return a.paciente_id === adm.paciente_id && a.status !== STATUS_ADMISSAO.encerrada && a.id !== dados.id;
  })[0];
  if (outraAberta && !(adm.desfecho_id && desfechoEncerraAdmissao(adm.desfecho_id))) {
    erros.push('Este paciente já tem uma admissão aberta. Use essa admissão ou registre a saída do hospital antes.');
  }
  if (erros.length) throw new Error(erros.join(' '));

  var salvo = atual
    ? atualizar('ADMISSOES', atual.id, adm)
    : inserir('ADMISSOES', Object.assign({ criado_por: usuario.id, status: STATUS_ADMISSAO.aguardando }, adm));
  registrarDesfecho(salvo, usuario);
  return detalheAdmissao(recalcularAdmissao(salvo.id));
}

/** Desfecho atual (vigente) da admissão no histórico, se houver. */
function desfechoVigente(admissaoId) {
  return listar('DESFECHOS_REGISTRADOS').filter(function (d) {
    return d.admissao_id === admissaoId && d.vigente === 'SIM';
  })[0] || null;
}

/**
 * Mantém o histórico de desfechos de acordo com a admissão salva:
 * desfecho novo vira um lançamento; desfecho alterado corrige o lançamento vigente;
 * desfecho apagado remove o lançamento vigente (foi lançado por engano).
 */
function registrarDesfecho(adm, usuario) {
  var vigente = desfechoVigente(adm.id);
  if (!adm.desfecho_id) {
    if (vigente) excluir('DESFECHOS_REGISTRADOS', vigente.id);
    return;
  }
  var dados = {
    unidade_id: vigente && normalizarData(vigente.data) === normalizarData(adm.data_desfecho) ? vigente.unidade_id :
      unidadeNaData_(adm, adm.data_desfecho),
    desfecho_id: adm.desfecho_id,
    data: normalizarData(adm.data_desfecho),
    encerra_admissao: desfechoEncerraAdmissao(adm.desfecho_id) ? 'SIM' : 'NÃO'
  };
  if (vigente) {
    var mudou = Object.keys(dados).some(function (c) { return String(vigente[c]) !== String(dados[c]); });
    if (mudou) atualizar('DESFECHOS_REGISTRADOS', vigente.id, dados);
    return;
  }
  inserir('DESFECHOS_REGISTRADOS', Object.assign({ admissao_id: adm.id, vigente: 'SIM', criado_por: usuario.id }, dados));
}

/** Paciente teve desfecho psicológico e continua internado: o acompanhamento recomeça na mesma admissão. */
function apiRetomarAcompanhamento(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var adm = buscarPorId('ADMISSOES', dados.id);
    if (!adm) throw new Error('Admissão não encontrada.');
    if (adm.status !== STATUS_ADMISSAO.acompanhamentoEncerrado) {
      throw new Error('Só é possível retomar quando o acompanhamento foi encerrado e o paciente segue internado.');
    }
    var data = normalizarData(dados.data) || hoje();
    if (data > hoje()) throw new Error('A data não pode estar no futuro.');
    if (data < normalizarData(adm.data_desfecho)) throw new Error('A retomada não pode ser antes do desfecho.');
    if (dados.justificativa_id && !buscarPorId('JUSTIFICATIVAS', dados.justificativa_id)) throw new Error('Justificativa não encontrada.');
    var desfecho = buscarPorId('DESFECHOS', adm.desfecho_id) || {};
    var nota = 'Acompanhamento retomado em ' + data.split('-').reverse().join('/') + ' por ' + usuario.nome +
      ' (desfecho anterior: ' + (desfecho.nome || '?') + ' em ' + normalizarData(adm.data_desfecho).split('-').reverse().join('/') + ').';
    var vigente = desfechoVigente(adm.id);
    if (vigente) atualizar('DESFECHOS_REGISTRADOS', vigente.id, { vigente: 'NÃO' });
    atualizar('ADMISSOES', adm.id, {
      desfecho_id: '',
      data_desfecho: '',
      retomado_em: data,
      justificativa_id: dados.justificativa_id || adm.justificativa_id,
      necessidade_acompanhamento: dados.necessidade_acompanhamento || adm.necessidade_acompanhamento,
      observacoes: [adm.observacoes, nota].filter(Boolean).join('\n')
    });
    return detalheAdmissao(recalcularAdmissao(adm.id));
  });
}

/** Profissional informado na tela ou, se não vier, quem está logado. */
function profissionalDoRegistro(id, usuario) {
  if (!id || id === usuario.id) return usuario;
  var prof = buscarPorId('PROFISSIONAIS', id);
  if (!prof || prof.ativo !== 'SIM') throw new Error('Profissional não encontrado.');
  return prof;
}

function admissaoParaRegistro(id) {
  var adm = buscarPorId('ADMISSOES', id);
  if (!adm) throw new Error('Admissão não encontrada.');
  if (adm.status === STATUS_ADMISSAO.encerrada) throw new Error('Esta admissão está encerrada: o paciente saiu do hospital.');
  if (adm.status === STATUS_ADMISSAO.acompanhamentoEncerrado) {
    throw new Error('O acompanhamento desta admissão foi encerrado. Use "Retomar acompanhamento" para registrar.');
  }
  return adm;
}

function validarDataRegistro(data, adm) {
  if (!data) throw new Error('Informe a data.');
  if (data > hoje()) throw new Error('A data não pode estar no futuro.');
  if (data < normalizarData(adm.data_admissao)) throw new Error('A data não pode ser antes da admissão.');
  if (adm.retomado_em && data < normalizarData(adm.retomado_em)) throw new Error('A data não pode ser antes da retomada do acompanhamento.');
}

function inteiroEntre(valor, min, max, padrao) {
  var n = valor === '' || valor === undefined || valor === null ? padrao : Number(valor);
  if (!(n >= min && n <= max && Math.floor(n) === n)) return null;
  return n;
}

function apiRegistrarAtendimento(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var adm = admissaoParaRegistro(dados.admissao_id);
    var data = normalizarData(dados.data);
    validarDataRegistro(data, adm);
    var hora = normalizarHora(dados.hora);
    if (!hora) throw new Error('Informe a hora do atendimento.');
    if (dataHora(data, hora) > agora()) throw new Error('O atendimento não pode estar no futuro.');
    if (PUBLICOS_ATENDIMENTO.indexOf(dados.publico) === -1) throw new Error('Escolha se o atendimento foi ao paciente, à família ou aos dois.');
    if (TIPOS_ATENDIMENTO.indexOf(dados.tipo_atendimento) === -1) throw new Error('Selecione o tipo da solicitação: interconsulta, equipe, busca ativa, espontânea ou seguimento psicológico.');
    if (dados.tipo_atendimento === 'INTERCONSULTA' && !dados.interconsulta_id) throw new Error('Selecione a interconsulta respondida.');
    if (dados.tipo_atendimento !== 'INTERCONSULTA' && dados.interconsulta_id) throw new Error('Somente atendimento por interconsulta pode responder a uma solicitação.');
    // quantidade = número de familiares atendidos (com "PACIENTE E FAMÍLIA", o paciente conta à parte).
    var familia = atendeuFamilia(dados.publico);
    var quantidade = familia ? inteiroEntre(dados.quantidade, 1, 30, 1) : 1;
    if (quantidade === null) throw new Error('Informe quantos familiares foram atendidos (1 a 30).');
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    var justificativaId = Object.prototype.hasOwnProperty.call(dados, 'justificativa_id') ? String(dados.justificativa_id || '').trim() : adm.justificativa_id;
    if (justificativaId) {
      var justificativa = buscarPorId('JUSTIFICATIVAS', justificativaId);
      if (!justificativa || justificativa.ativo === 'NÃO') throw new Error('Selecione uma justificativa de acompanhamento válida.');
    }
    // v27: justificativa em todo atendimento ("SEM DEMANDA PARA ACOMPANHAMENTO" quando não houver seguimento).
    // Só as admissões antigas com necessidade "NÃO" ou "N / A" dispensam.
    var semAcompanhamento = SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) !== -1;
    if (!semAcompanhamento && !justificativaId) throw new Error('Selecione a justificativa no registro do atendimento.');
    // Descrição da demanda: informada no 1º atendimento (avaliação) e corrigível depois na tela da internação.
    var descricaoDemanda = String(dados.descricao_demanda || '').trim();
    if (adm.status === STATUS_ADMISSAO.aguardando && !descricaoDemanda && !adm.descricao_demanda) {
      throw new Error('Informe a descrição da demanda no 1º atendimento.');
    }
    var atendimento = {
      admissao_id: adm.id,
      unidade_id: unidadeDoRegistro_(dados, adm, data, hora),
      data: data,
      hora: hora,
      publico: dados.publico,
      tipo_atendimento: dados.tipo_atendimento,
      quantidade: quantidade,
      paciente_impossibilitado: '',
      profissional_id: prof.id,
      categoria: prof.categoria,
      justificativa_id: justificativaId || '',
      observacao: String(dados.observacao || '').trim(),
      criado_por: usuario.id
    };
    atendimento.conta_prazo = contaParaPrazo(atendimento) ? 'SIM' : 'NÃO';
    if (dados.interconsulta_id) validarRespostaInterconsulta_(dados.interconsulta_id, atendimento);
    listar('ATENDIMENTOS'); // Completa o cabeçalho do banco anterior antes de gravar.
    var salvo = inserir('ATENDIMENTOS', atendimento);
    // Registro retroativo mantém sua justificativa própria, sem substituir a do contato mais recente.
    var temContatoPosterior = listar('ATENDIMENTOS').some(function (a) {
      return a.admissao_id === adm.id && contaParaPrazo(a) && dataHora(a.data, a.hora) > dataHora(data, hora);
    });
    var mudancasAdm = {};
    if (contaParaPrazo(atendimento) && !temContatoPosterior && String(adm.justificativa_id || '') !== String(justificativaId || '')) {
      mudancasAdm.justificativa_id = justificativaId || '';
    }
    if (Object.keys(mudancasAdm).length) atualizar('ADMISSOES', adm.id, mudancasAdm);
    // 1º atendimento: a descrição da demanda passa a ter registro próprio, com data e unidade (Demanda.js).
    if (adm.status === STATUS_ADMISSAO.aguardando) {
      registrarDescricaoDaAvaliacao_(adm, salvo, descricaoDemanda ? validarDescricaoDemanda_(descricaoDemanda) : adm.descricao_demanda, usuario);
    }
    if (dados.interconsulta_id) atualizar('INTERCONSULTAS', dados.interconsulta_id, { atendimento_id: salvo.id });
    return detalheAdmissao(recalcularAdmissao(adm.id));
  });
}

/** Quem registrou ou a coordenação pode excluir um lançamento. */
function exigirAutorOuCoordenacao(registro, usuario) {
  if (usuario.perfil === 'COORDENAÇÃO') return;
  if (registro.criado_por === usuario.id || registro.profissional_id === usuario.id) return;
  throw new Error('Só quem registrou ou a coordenação pode excluir.');
}

function apiExcluirAtendimento(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var atendimento = buscarPorId('ATENDIMENTOS', id);
    if (!atendimento) throw new Error('Atendimento não encontrado.');
    exigirAutorOuCoordenacao(atendimento, usuario);
    excluir('ATENDIMENTOS', id);
    excluirDescricaoDoAtendimento_(atendimento, usuario);
    return detalheAdmissao(recalcularAdmissao(atendimento.admissao_id));
  });
}

function apiRegistrarAtividade(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var adm = admissaoParaRegistro(dados.admissao_id);
    var data = normalizarData(dados.data);
    validarDataRegistro(data, adm);
    var tipos = listar('LISTAS').filter(function (i) { return i.lista === 'ATIVIDADE_ASSISTENCIAL'; }).map(function (i) { return i.valor; });
    if (tipos.indexOf(dados.tipo) === -1) throw new Error('Escolha a atividade.');
    var quantidade = inteiroEntre(dados.quantidade, 1, 20, 1);
    if (quantidade === null) throw new Error('Quantidade inválida.');
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    inserir('ATIVIDADES', {
      admissao_id: adm.id, unidade_id: unidadeDoRegistro_(dados, adm, data), data: data, tipo: dados.tipo, quantidade: quantidade,
      profissional_id: prof.id, categoria: prof.categoria, criado_por: usuario.id
    });
    return detalheAdmissao(adm);
  });
}

function apiExcluirAtividade(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var atividade = buscarPorId('ATIVIDADES', id);
    if (!atividade) throw new Error('Atividade não encontrada.');
    exigirAutorOuCoordenacao(atividade, usuario);
    excluir('ATIVIDADES', id);
    return detalheAdmissao(buscarPorId('ADMISSOES', atividade.admissao_id));
  });
}

// ===== Transferencias.js =====
/** Localização atual e histórico de movimentações internas da mesma internação. */
function listarTransferencias_() {
  // Se a aba ainda não existir, a própria leitura cria (carregarTabelas, em Db.js).
  return listar('TRANSFERENCIAS');
}

function transferenciasDaAdmissao_(adm, registros) {
  return (registros || listarTransferencias_()).filter(function (t) { return t.admissao_id === adm.id; })
    .slice().sort(function (a, b) {
      return dataHora(a.data, a.hora).localeCompare(dataHora(b.data, b.hora)) ||
        String(a.criado_em || '').localeCompare(String(b.criado_em || ''));
    });
}

function unidadeNaData_(adm, data, hora, registros) {
  var momento = dataHora(data || hoje(), hora || '23:59');
  return transferenciasDaAdmissao_(adm, registros).reduce(function (id, t) {
    return dataHora(t.data, t.hora) <= momento ? t.destino_unidade_id : id;
  }, adm.unidade_id);
}

function unidadeDoRegistro_(dados, adm, data, hora) {
  var id = dados.unidade_id || unidadeNaData_(adm, data, hora);
  var u = buscarPorId('UNIDADES', id);
  if (!u) throw new Error('Selecione uma unidade válida para o registro.');
  if (dados.unidade_id && u.ativo === 'NÃO') throw new Error('Esta unidade está inativa.');
  return id;
}

function apiTransferirPaciente(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    listarTransferencias_();
    var admissaoId = comTrava(function () {
      // A operação inteira já roda com a trava e lê depois dela (responderGravando): duas profissionais
      // não criam uma origem desatualizada.
      var adm = buscarPorId('ADMISSOES', dados.admissao_id);
      if (!adm) throw new Error('Admissão não encontrada.');
      if (adm.status === STATUS_ADMISSAO.encerrada || desfechoEncerraAdmissao(adm.desfecho_id)) {
        throw new Error('Não é possível transferir: esta internação já foi encerrada.');
      }
      var data = normalizarData(dados.data), hora = normalizarHora(dados.hora);
      if (!data || !hora) throw new Error('Informe data e hora da transferência.');
      if (data < normalizarData(adm.data_admissao)) throw new Error('A transferência não pode ser antes da admissão.');
      if (dataHora(data, hora) > agora()) throw new Error('A transferência não pode estar no futuro.');
      var destino = buscarPorId('UNIDADES', dados.unidade_id);
      if (!destino || destino.ativo === 'NÃO') throw new Error('Selecione uma unidade de destino ativa.');
      if (dados.setor_id && destino.setor_id !== dados.setor_id) throw new Error('A unidade não pertence ao setor selecionado.');
      var historico = transferenciasDaAdmissao_(adm);
      var ultima = historico[historico.length - 1];
      if (ultima && dataHora(data, hora) < dataHora(ultima.data, ultima.hora)) {
        throw new Error('A transferência não pode ser antes da última movimentação registrada.');
      }
      var origem = ultima ? ultima.destino_unidade_id : adm.unidade_id;
      if (destino.id === origem) throw new Error('O paciente já está nessa unidade.');
      var registro = { id: novoId(), admissao_id: adm.id, origem_unidade_id: origem,
        destino_unidade_id: destino.id, data: data, hora: hora, criado_por: usuario.id, criado_em: agoraIso() };
      inserir('TRANSFERENCIAS', registro);
      // A tela pergunta se a demanda continua a mesma. Se mudou, a nova descrição é registrada aqui,
      // na data e na unidade de destino; se continua, nada conta de novo no compilado.
      if (dados.demanda_mudou === 'SIM') {
        registrarMudancaDeDemanda_(adm, { descricao: dados.descricao_demanda, data: data, hora: hora, unidade_id: destino.id,
          origem: ORIGENS_DESCRICAO.transferencia, transferencia_id: registro.id }, usuario);
      }
      return adm.id;
    });
    return detalheAdmissao(buscarPorId('ADMISSOES', admissaoId));
  });
}

// ===== Demanda.js =====
/**
 * Descrição da demanda ao longo da internação (pedido da coordenação, opção 2):
 * - 1º atendimento: registra a descrição inicial (origem AVALIAÇÃO);
 * - "Editar" (erro de preenchimento): substitui a descrição atual, sem criar registro novo;
 * - "A demanda mudou": registra uma nova descrição com data e unidade, sem apagar a anterior (MUDANÇA);
 * - transferência: a tela pergunta se a demanda mudou; se mudou, registra ali (TRANSFERÊNCIA).
 * No compilado, cada registro conta no mês e na unidade em que foi feito.
 * Internações anteriores a esta versão, sem nenhum registro, contam a descrição da admissão (LEGADO),
 * na data do 1º atendimento.
 */

var ORIGENS_DESCRICAO = { avaliacao: 'AVALIAÇÃO', mudanca: 'MUDANÇA', transferencia: 'TRANSFERÊNCIA', legado: 'LEGADO' };

function porMomentoDaDescricao_(a, b) {
  return dataHora(a.data, a.hora || '00:00').localeCompare(dataHora(b.data, b.hora || '00:00')) ||
    String(a.criado_em || '').localeCompare(String(b.criado_em || ''));
}

/**
 * Descrições válidas da admissão, da mais antiga para a mais recente (a última é a atual).
 * registros: todos os registros desta admissão, inclusive os excluídos (para saber se é uma internação antiga).
 */
function descricoesDaAdmissao_(adm, registros) {
  var todos = registros || listar('DESCRICOES_DEMANDA').filter(function (d) { return d.admissao_id === adm.id; });
  var validos = todos.filter(function (d) { return !d.excluido_em; }).sort(porMomentoDaDescricao_);
  if (validos.length || todos.length || !adm.descricao_demanda) return validos;
  var data = normalizarData(adm.primeiro_atendimento) || normalizarData(adm.data_admissao);
  return [{ id: 'legado_' + adm.id, admissao_id: adm.id, unidade_id: unidadeNaData_(adm, data, '23:59'), data: data, hora: '',
    descricao: adm.descricao_demanda, origem: ORIGENS_DESCRICAO.legado, atendimento_id: '', transferencia_id: '',
    profissional_id: '', criado_por: '', criado_em: '', virtual: true }];
}

/** Todas as descrições de todas as internações, para o compilado. */
function listarDescricoesDemanda_() {
  var porAdmissao = agruparPor_(listar('DESCRICOES_DEMANDA'), 'admissao_id');
  var lista = [];
  listar('ADMISSOES').forEach(function (adm) {
    lista = lista.concat(descricoesDaAdmissao_(adm, porAdmissao[adm.id] || []));
  });
  return lista;
}

function validarDescricaoDemanda_(valor) {
  var descricao = String(valor || '').trim();
  if (!descricao) throw new Error('Selecione a descrição da demanda.');
  var existe = listar('LISTAS').some(function (i) { return i.lista === 'DESCRICAO_DEMANDA' && i.valor === descricao; });
  if (!existe) throw new Error('Descrição da demanda não encontrada na lista.');
  return descricao;
}

/** Grava a descrição da internação antiga como registro, para que a mudança não a apague. */
function materializarDescricaoLegada_(adm, descricoes) {
  if (descricoes.length !== 1 || !descricoes[0].virtual) return descricoes;
  var d = Object.assign({}, descricoes[0]);
  delete d.id;
  delete d.virtual;
  return [inserir('DESCRICOES_DEMANDA', d)];
}

/** A admissão guarda a descrição atual (a do registro mais recente). */
function sincronizarDescricaoAtual_(admissaoId) {
  var adm = buscarPorId('ADMISSOES', admissaoId);
  var descricoes = descricoesDaAdmissao_(adm);
  var atual = descricoes[descricoes.length - 1];
  if (atual && atual.descricao !== adm.descricao_demanda) atualizar('ADMISSOES', adm.id, { descricao_demanda: atual.descricao });
}

/** 1º atendimento: registra a descrição inicial, na data, hora e unidade do atendimento. */
function registrarDescricaoDaAvaliacao_(adm, atendimento, descricao, usuario) {
  var temAvaliacao = descricoesDaAdmissao_(adm).some(function (d) { return d.origem === ORIGENS_DESCRICAO.avaliacao; });
  if (temAvaliacao || !descricao) return;
  inserir('DESCRICOES_DEMANDA', {
    admissao_id: adm.id, unidade_id: atendimento.unidade_id, data: atendimento.data, hora: atendimento.hora, descricao: descricao,
    origem: ORIGENS_DESCRICAO.avaliacao, atendimento_id: atendimento.id, profissional_id: atendimento.profissional_id, criado_por: usuario.id
  });
  sincronizarDescricaoAtual_(adm.id);
}

/**
 * O atendimento com a descrição inicial foi excluído. Se a internação tem outros atendimentos, a descrição
 * passa para o novo 1º atendimento (data, hora e unidade dele); se não tem, deixa de contar.
 */
function excluirDescricaoDoAtendimento_(atendimento, usuario) {
  var registros = listar('DESCRICOES_DEMANDA').filter(function (d) { return d.atendimento_id === atendimento.id && !d.excluido_em; });
  if (!registros.length) return;
  var novoPrimeiro = listar('ATENDIMENTOS').filter(function (a) { return a.admissao_id === atendimento.admissao_id && a.id !== atendimento.id; })
    .sort(function (a, b) { return dataHora(a.data, a.hora).localeCompare(dataHora(b.data, b.hora)); })[0];
  registros.forEach(function (d) {
    atualizar('DESCRICOES_DEMANDA', d.id, novoPrimeiro
      ? { data: novoPrimeiro.data, hora: novoPrimeiro.hora, unidade_id: novoPrimeiro.unidade_id, atendimento_id: novoPrimeiro.id,
        profissional_id: novoPrimeiro.profissional_id }
      : { excluido_em: agoraIso(), excluido_por: usuario.id });
  });
  sincronizarDescricaoAtual_(atendimento.admissao_id);
}

/** Nova descrição porque a demanda mudou (na tela da internação ou na transferência). */
function registrarMudancaDeDemanda_(adm, campos, usuario) {
  if (adm.status === STATUS_ADMISSAO.aguardando) throw new Error('A descrição da demanda é informada no 1º atendimento.');
  var descricao = validarDescricaoDemanda_(campos.descricao);
  var descricoes = materializarDescricaoLegada_(adm, descricoesDaAdmissao_(adm));
  var atual = descricoes[descricoes.length - 1];
  if (atual && atual.descricao === descricao) throw new Error('Esta já é a descrição atual. Escolha a nova demanda.');
  if (atual && dataHora(campos.data, campos.hora) < dataHora(atual.data, atual.hora || '00:00')) {
    throw new Error('A mudança não pode ser antes da descrição atual (' + atual.data.split('-').reverse().join('/') + ').');
  }
  var registro = inserir('DESCRICOES_DEMANDA', {
    admissao_id: adm.id, unidade_id: campos.unidade_id || unidadeNaData_(adm, campos.data, campos.hora),
    data: campos.data, hora: campos.hora, descricao: descricao, origem: campos.origem,
    transferencia_id: campos.transferencia_id || '', profissional_id: usuario.id, criado_por: usuario.id
  });
  sincronizarDescricaoAtual_(adm.id);
  return registro;
}

/** "Editar": corrige a descrição atual (erro de preenchimento). Não cria registro novo nem muda data e unidade. */
function apiSalvarDescricaoDemanda(dados) {
  return responderGravando(function () {
    usuarioAtual();
    dados = dados || {};
    var adm = buscarPorId('ADMISSOES', dados.id);
    if (!adm) throw new Error('Admissão não encontrada.');
    var descricao = validarDescricaoDemanda_(dados.descricao_demanda);
    var descricoes = descricoesDaAdmissao_(adm);
    var atual = descricoes[descricoes.length - 1];
    if (!atual) {
      // Sem 1º atendimento ainda: só guarda na admissão; o registro nasce no 1º atendimento.
      atualizar('ADMISSOES', adm.id, { descricao_demanda: descricao });
    } else if (atual.virtual) {
      materializarDescricaoLegada_(adm, [Object.assign({}, atual, { descricao: descricao })]);
      sincronizarDescricaoAtual_(adm.id);
    } else if (atual.descricao !== descricao) {
      atualizar('DESCRICOES_DEMANDA', atual.id, { descricao: descricao });
      sincronizarDescricaoAtual_(adm.id);
    }
    return detalheAdmissao(buscarPorId('ADMISSOES', adm.id));
  });
}

/** "A demanda mudou": registra a nova descrição com data, hora e a unidade daquele momento. */
function apiMudarDescricaoDemanda(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    var adm = buscarPorId('ADMISSOES', dados.id);
    if (!adm) throw new Error('Admissão não encontrada.');
    if (adm.status === STATUS_ADMISSAO.encerrada) throw new Error('Esta internação está encerrada: use "Editar" para corrigir a descrição.');
    var data = normalizarData(dados.data) || hoje();
    var hora = normalizarHora(dados.hora) || agora().slice(11, 16);
    if (data < normalizarData(adm.data_admissao)) throw new Error('A mudança não pode ser antes da admissão.');
    if (dataHora(data, hora) > agora()) throw new Error('A mudança não pode estar no futuro.');
    registrarMudancaDeDemanda_(adm, { descricao: dados.descricao_demanda, data: data, hora: hora, origem: ORIGENS_DESCRICAO.mudanca }, usuario);
    return detalheAdmissao(buscarPorId('ADMISSOES', adm.id));
  });
}

/** Exclui uma mudança registrada por engano. A descrição do 1º atendimento sai junto com o atendimento. */
function apiExcluirDescricaoDemanda(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var d = buscarPorId('DESCRICOES_DEMANDA', id);
    if (!d || d.excluido_em) throw new Error('Registro da descrição não encontrado.');
    if (d.origem !== ORIGENS_DESCRICAO.mudanca && d.origem !== ORIGENS_DESCRICAO.transferencia) {
      throw new Error('Só uma mudança de demanda pode ser excluída. Para corrigir a descrição, use "Editar".');
    }
    exigirAutorOuCoordenacao(d, usuario);
    atualizar('DESCRICOES_DEMANDA', d.id, { excluido_em: agoraIso(), excluido_por: usuario.id });
    sincronizarDescricaoAtual_(d.admissao_id);
    return detalheAdmissao(buscarPorId('ADMISSOES', d.admissao_id));
  });
}

// ===== Interconsultas.js =====
/** Interconsultas pertencem à internação, mas cada solicitação tem seu próprio prazo. */
function prepararInterconsultas_() {
  // Migração aditiva e idempotente: não apaga nem reorganiza as colunas antigas.
  // A aba e as colunas novas são criadas pela própria leitura (carregarTabelas, em Db.js); aqui
  // só se confere, em memória, se alguma solicitação antiga ainda não virou interconsulta.
  var faltaLegado = function () {
    var existentes = indicePorId_('INTERCONSULTAS');
    return listar('ADMISSOES').filter(function (a) { return a.data_solicitacao && !existentes['legado_' + a.id]; });
  };
  if (!faltaLegado().length) return;
  comTrava(function () {
    // Outra execução pode ter concluído a migração enquanto esta aguardava a trava (a trava relê tudo).
    faltaLegado().forEach(function (a) {
      inserir('INTERCONSULTAS', Object.assign({}, a, { id: 'legado_' + a.id, admissao_id: a.id, origem: 'LEGADO', atendimento_id: '' }));
    });
  });
}

/**
 * Prazo de resposta da solicitação em dias úteis. Desde a v27 fica em prazo_dias_uteis; as gravadas
 * antes guardavam horas em prazo_horas (24h = 1 dia útil).
 */
function prazoDiasDaInterconsulta_(i) {
  if (i.prazo_dias_uteis !== '' && i.prazo_dias_uteis !== undefined) return i.prazo_dias_uteis;
  if (i.prazo_horas !== '' && i.prazo_horas !== undefined && !isNaN(Number(i.prazo_horas))) {
    return String(Math.max(1, Math.ceil(Number(i.prazo_horas) / 24)));
  }
  return '';
}

/** Resposta calculada por solicitação; somente registros antigos mantêm a associação automática. */
function listarInterconsultas_() {
  prepararInterconsultas_();
  var admissoes = mapaPorId('ADMISSOES');
  var atendimentos = listar('ATENDIMENTOS');
  var porAdmissao = agruparPor_(atendimentos, 'admissao_id');
  var porId = indicePorId_('ATENDIMENTOS');
  var feriados = conjuntoFeriados(listar('FERIADOS'));
  return listar('INTERCONSULTAS').filter(function (i) { return !i.excluido_em; }).map(function (original) {
    var adm = admissoes[original.admissao_id];
    if (!adm) return null;
    var legado = original.origem === 'LEGADO';
    var i = Object.assign({}, original);
    if (legado) ['tipo_solicitacao', 'motivo_solicitacao_id', 'data_solicitacao', 'hora_solicitacao',
      'para_quem', 'familiar_nome', 'familiar_parentesco'].forEach(function (c) { i[c] = adm[c]; });
    var resposta = porId[i.atendimento_id];
    var candidatos = legado ? (porAdmissao[adm.id] || []) :
      (resposta && resposta.admissao_id === adm.id ? [resposta] : []);
    var encerrada = adm.status === STATUS_ADMISSAO.encerrada || (legado && Boolean(adm.desfecho_id));
    var contexto = Object.assign({}, i, { data_desfecho: encerrada ? adm.data_desfecho : '' });
    var prioridade = legado ? prioridadeSolicitacaoEmDias_(prioridadeDe(buscarPorId('MOTIVOS_SOLICITACAO', i.motivo_solicitacao_id))) :
      (i.tem_prazo === 'SIM' ? { nome: i.prioridade_solicitacao, prazo: prazoDiasDaInterconsulta_(i) } : null);
    Object.assign(i, calcularResposta(contexto, candidatos, {
      prioridade: prioridade, tiposComPrazo: legado ? tiposSolicitacaoComPrazo() : (i.tem_prazo === 'SIM' ? [i.tipo_solicitacao] : []), agora: agora(), feriados: feriados
    }));
    var respondidoPor = i.momento_resposta ? candidatos.filter(function (a) {
      var vale = contaParaPrazo(a);
      return vale && dataHora(a.data, a.hora) === i.momento_resposta;
    })[0] : null;
    i.atendimento_resposta_id = respondidoPor ? respondidoPor.id : '';
    if (!legado && !i.prioridade_solicitacao) i.prioridade_solicitacao = original.prioridade_solicitacao;
    i.pendente = !i.momento_resposta && !encerrada;
    i.motivo_nome = (buscarPorId('MOTIVOS_SOLICITACAO', i.motivo_solicitacao_id) || {}).nome || '';
    // Novas solicitações independem do encerramento psicológico. O legado mantém sua regra histórica.
    i.prazo = prazosDaAdmissao(Object.assign({}, contexto, i, {
      status: encerrada ? STATUS_ADMISSAO.encerrada : STATUS_ADMISSAO.aguardando, desfecho_id: encerrada ? adm.desfecho_id : ''
    }), hoje(), agora(), feriados).interconsulta;
    if (i.momento_resposta && i.resposta_no_prazo === 'SEM PRAZO') {
      i.prazo = { estado: 'CUMPRIDO', realizado: i.momento_resposta, dias: i.dias_resposta, resultado: 'SEM PRAZO' };
    }
    return i;
  }).filter(Boolean);
}

function apiRegistrarInterconsulta(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    var adm = buscarPorId('ADMISSOES', dados.admissao_id);
    if (!adm) throw new Error('Admissão não encontrada.');
    if (adm.status === STATUS_ADMISSAO.encerrada) throw new Error('Esta admissão está encerrada: o paciente saiu do hospital.');
    var data = normalizarData(dados.data_solicitacao);
    var hora = normalizarHora(dados.hora_solicitacao);
    if (!data || !hora) throw new Error('Informe data e hora da solicitação.');
    if (data < normalizarData(adm.data_admissao)) throw new Error('A solicitação não pode ser antes da admissão.');
    if (dataHora(data, hora) > agora()) throw new Error('A solicitação não pode estar no futuro.');
    // Interconsulta é sempre uma solicitação da equipe, independentemente do payload da tela.
    var motivo = buscarPorId('MOTIVOS_SOLICITACAO', dados.motivo_solicitacao_id);
    if (!motivo || motivo.ativo === 'NÃO') throw new Error('Escolha o motivo da solicitação.');
    if (PARA_QUEM_SOLICITACAO.indexOf(dados.para_quem) === -1) throw new Error('Informe para quem é a solicitação.');
    var familiar = dados.para_quem === 'FAMILIAR';
    var nome = familiar ? formatarNome(dados.familiar_nome || '') : '';
    var parentesco = familiar ? formatarNome(dados.familiar_parentesco || '') : '';
    if (familiar && !nome && !parentesco) throw new Error('Informe o nome ou o parentesco do familiar.');
    var prioridade = prioridadeSolicitacaoEmDias_(prioridadeDe(motivo));
    var temPrazo = prioridade && prioridade.prazo !== '' && tiposSolicitacaoComPrazo().indexOf('EQUIPE') !== -1;
    prepararInterconsultas_();
    inserir('INTERCONSULTAS', {
      admissao_id: adm.id, unidade_id: unidadeNaData_(adm, data, hora), tipo_solicitacao: 'EQUIPE',
      motivo_solicitacao_id: motivo.id, data_solicitacao: data, hora_solicitacao: hora,
      para_quem: dados.para_quem, familiar_nome: nome, familiar_parentesco: parentesco,
      prioridade_solicitacao: prioridade ? prioridade.nome : '', prazo_horas: '', prazo_dias_uteis: temPrazo ? prioridade.prazo : '',
      tem_prazo: temPrazo ? 'SIM' : 'NÃO', origem: 'SOLICITAÇÃO', observacoes: String(dados.observacoes || '').trim(), criado_por: usuario.id
    });
    return detalheAdmissao(adm);
  });
}

function validarRespostaInterconsulta_(id, atendimento) {
  var i = listarInterconsultas_().filter(function (s) { return s.id === id; })[0];
  if (!i || i.admissao_id !== atendimento.admissao_id) throw new Error('A interconsulta não pertence a esta admissão.');
  if (i.momento_resposta) throw new Error('Esta interconsulta já foi respondida.');
  if (dataHora(atendimento.data, atendimento.hora) < dataHora(i.data_solicitacao, i.hora_solicitacao)) {
    throw new Error('O atendimento não pode ser antes da solicitação.');
  }
  if (!contaParaPrazo(atendimento)) throw new Error('Atendimento sem público informado.');
  return i;
}

function apiResponderInterconsulta(dados) {
  return responderGravando(function () {
    usuarioAtual();
    var atendimento = buscarPorId('ATENDIMENTOS', dados.atendimento_id);
    if (!atendimento) throw new Error('Escolha o atendimento que respondeu à solicitação.');
    var i = validarRespostaInterconsulta_(dados.id, atendimento);
    atualizar('ATENDIMENTOS', atendimento.id, { tipo_atendimento: 'INTERCONSULTA' });
    atualizar('INTERCONSULTAS', i.id, { atendimento_id: atendimento.id, origem: 'SOLICITAÇÃO',
      tem_prazo: i.prazo_resposta ? 'SIM' : 'NÃO', prazo_dias_uteis: i.prazo_resposta ?
        (prazoDiasDaInterconsulta_(i) !== '' ? prazoDiasDaInterconsulta_(i) :
          diasUteisEntre(i.data_solicitacao, i.prazo_resposta, conjuntoFeriados(listar('FERIADOS')))) : '',
      prioridade_solicitacao: i.prioridade_solicitacao });
    return detalheAdmissao(buscarPorId('ADMISSOES', i.admissao_id));
  });
}

/** Exclui da operação, mantendo a marca para que a migração não recrie solicitações antigas. */
function apiExcluirInterconsulta(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    prepararInterconsultas_();
    var i = buscarPorId('INTERCONSULTAS', id);
    if (!i || i.excluido_em) throw new Error('Interconsulta não encontrada ou já excluída.');
    exigirAutorOuCoordenacao(i, usuario);
    var adm = buscarPorId('ADMISSOES', i.admissao_id);
    if (!adm) throw new Error('Admissão não encontrada.');
    atualizar('INTERCONSULTAS', i.id, { excluido_em: agoraIso(), excluido_por: usuario.id });
    // Não apaga atendimentos, dados da admissão nem outras solicitações.
    return detalheAdmissao(adm);
  });
}

// ===== Compilado.js =====
/**
 * Compilado (tela e exportação) e registro do dia: reuniões de equipe e atividades gerenciais.
 */

function opcoesCompilado(f) {
  var ano = Number(f.ano);
  if (!(ano >= 2020 && ano <= 2100)) throw new Error('Escolha o ano.');
  var eixo = f.eixo === 'MES' ? 'MES' : 'UNIDADE';
  var mes = eixo === 'UNIDADE' ? Number(f.mes) : null;
  if (eixo === 'UNIDADE' && !(mes >= 1 && mes <= 12)) throw new Error('Escolha o mês.');
  if (f.grupo && !GRUPOS_COMPILADO[f.grupo]) throw new Error('Grupo inválido.');
  return {
    ano: ano, mes: mes, eixo: eixo, grupo: f.grupo || 'TODOS',
    setor_id: f.setor_id || '', unidade_id: f.unidade_id || '', diasPrimeiro: diasPrimeiroAtendimento()
  };
}

function gerarCompilado(f) {
  var listas = {};
  listar('LISTAS').slice().sort(porOrdem).forEach(function (i) {
    if (i.ativo !== 'SIM') return;
    (listas[i.lista] = listas[i.lista] || []).push(i.valor);
  });
  return montarCompilado({
    unidades: listar('UNIDADES').slice().sort(porOrdem),
    admissoes: listar('ADMISSOES'),
    interconsultas: listarInterconsultas_(),
    descricoes: listarDescricoesDemanda_(),
    atendimentos: listar('ATENDIMENTOS'),
    atividades: listar('ATIVIDADES'),
    reunioes: listar('REUNIOES'),
    gerenciais: listar('GERENCIAIS'),
    desfechosRegistrados: listar('DESFECHOS_REGISTRADOS'),
    motivos: listar('MOTIVOS_SOLICITACAO').slice().sort(porOrdem),
    prioridades: listar('PRIORIDADES').filter(function (p) { return p.ativo !== 'NÃO'; }).sort(porOrdem),
    listas: listas,
    desfechos: listar('DESFECHOS').slice().sort(porOrdem)
  }, opcoesCompilado(f));
}

function apiCompilado(filtros) {
  return responder(function () {
    usuarioAtual();
    return gerarCompilado(filtros || {});
  });
}

/** Cria uma planilha nova no Drive de quem exportou, com o compilado formatado. Devolve o endereço. */
function apiExportarCompilado(filtros) {
  return responder(function () {
    usuarioAtual();
    var c = gerarCompilado(filtros || {});
    var t = compiladoEmTabela(c);
    var planilha = SpreadsheetApp.create(c.titulo + ' — ' + c.subtitulo);
    var aba = planilha.getSheets()[0];
    aba.setName('Compilado');
    aba.getRange(1, 1, t.linhas.length, t.largura).setNumberFormat('@').setValues(t.linhas);
    t.tipos.forEach(function (tipo, i) {
      var linha = aba.getRange(i + 1, 1, 1, t.largura);
      if (tipo === 'titulo') linha.setFontWeight('bold').setFontSize(14);
      else if (tipo === 'cabecalho') linha.setFontWeight('bold').setBackground('#dbe7f3');
      else if (tipo === 'destaque') linha.setFontWeight('bold').setBackground('#f3f6f9');
      else if (tipo === 'nota') linha.setFontStyle('italic').setFontColor('#616e7c');
    });
    aba.setColumnWidth(1, 320);
    aba.setFrozenColumns(1);
    return { url: planilha.getUrl(), nome: planilha.getName() };
  });
}

// ---------- Registro do dia: reuniões de equipe e atividades gerenciais ----------

function valoresDaLista(nome) {
  return listar('LISTAS').filter(function (i) { return i.lista === nome && i.ativo === 'SIM'; }).map(function (i) { return i.valor; });
}

function dadosRegistroGeral(dados, usuario, lista) {
  var data = normalizarData(dados.data);
  if (!data) throw new Error('Informe a data.');
  if (data > hoje()) throw new Error('A data não pode estar no futuro.');
  if (valoresDaLista(lista).indexOf(dados.tipo) === -1) throw new Error('Escolha o tipo.');
  var quantidade = inteiroEntre(dados.quantidade, 1, 50, 1);
  if (quantidade === null) throw new Error('Quantidade inválida.');
  var prof = profissionalDoRegistro(dados.profissional_id, usuario);
  return {
    data: data, tipo: dados.tipo, quantidade: quantidade,
    profissional_id: prof.id, categoria: prof.categoria, criado_por: usuario.id
  };
}

function apiRegistrarReuniao(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var registro = dadosRegistroGeral(dados, usuario, 'REUNIAO_EQUIPE');
    if (!buscarPorId('UNIDADES', dados.unidade_id)) throw new Error('Escolha a unidade.');
    registro.unidade_id = dados.unidade_id;
    inserir('REUNIOES', registro);
    return registrosDoMes(dados.data);
  });
}

function apiRegistrarGerencial(dados) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    inserir('GERENCIAIS', dadosRegistroGeral(dados, usuario, 'ATIVIDADE_GERENCIAL'));
    return registrosDoMes(dados.data);
  });
}

/** Reuniões e atividades gerenciais do mês da data, mais recentes primeiro. */
function registrosDoMes(data) {
  var mes = mesReferencia(data) || mesReferencia(hoje());
  var profs = mapaPorId('PROFISSIONAIS');
  var unidades = mapaPorId('UNIDADES');
  var doMes = function (tabela) {
    return listar(tabela).filter(function (r) { return mesReferencia(r.data) === mes; })
      .sort(function (a, b) { return String(b.data).localeCompare(String(a.data)) || String(b.criado_em).localeCompare(String(a.criado_em)); })
      .map(function (r) {
        return Object.assign({
          profissional_nome: (profs[r.profissional_id] || {}).nome || '',
          unidade_nome: (unidades[r.unidade_id] || {}).nome || ''
        }, r);
      });
  };
  return { mes: mes, reunioes: doMes('REUNIOES'), gerenciais: doMes('GERENCIAIS') };
}

function apiRegistrosDoMes(data) {
  return responder(function () {
    usuarioAtual();
    return registrosDoMes(data);
  });
}

function apiExcluirReuniao(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var r = buscarPorId('REUNIOES', id);
    if (!r) throw new Error('Registro não encontrado.');
    exigirAutorOuCoordenacao(r, usuario);
    excluir('REUNIOES', id);
    return registrosDoMes(r.data);
  });
}

function apiExcluirGerencial(id) {
  return responderGravando(function () {
    var usuario = usuarioAtual();
    var r = buscarPorId('GERENCIAIS', id);
    if (!r) throw new Error('Registro não encontrado.');
    exigirAutorOuCoordenacao(r, usuario);
    excluir('GERENCIAIS', id);
    return registrosDoMes(r.data);
  });
}

// ===== Gestao.js =====
/**
 * Telas de gestão: pacientes ativos por setor e unidade, interconsultas e os três prazos de cada admissão.
 */

/** Admissão resumida com os três prazos e os dias de internação. */
function itemDeGestao(adm, aux) {
  var r = resumoAdmissao(adm, aux);
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var prioridade = justificativa.prioridade_id ? (aux.prioridades[justificativa.prioridade_id] || {}) : {};
  var prazos = prazosDaAdmissao(r, aux.hoje, aux.agora, aux.feriados);
  var pendentes = (aux.interconsultasPorAdmissao[adm.id] || []).filter(function (i) { return i.pendente && i.prazo_resposta; })
    .sort(function (a, b) { return a.prazo_resposta.localeCompare(b.prazo_resposta); });
  if (pendentes.length) {
    prazos.interconsulta = pendentes[0].prazo;
    var p = prazos.interconsulta;
    if (!prazos.proximo || p.prazo < prazos.proximo.prazo + (prazos.proximo.prazo.length === 10 ? ' 23:59' : '')) {
      prazos.proximo = { tipo: 'INTERCONSULTA', prazo: p.prazo, situacao: p.situacao };
    }
  }
  return Object.assign(r, {
    // Painel de prazos: cada interconsulta pendente com prazo vira uma linha própria.
    solicitacoes_pendentes: pendentes.map(function (i) {
      return { id: i.id, prazo: i.prazo_resposta, situacao: i.prazo.situacao, prioridade: i.prioridade_solicitacao || '',
        motivo_nome: i.motivo_nome, dias_restantes: i.prazo.dias_restantes };
    }),
    unidade_id: r.unidade_atual_id,
    unidade_nome: r.unidade_atual_nome,
    setor_id: r.setor_atual_id,
    prazos: prazos,
    dias_internado: diasEntre(adm.data_admissao, aux.hoje),
    periodicidade: prioridade.periodicidade || ''
  });
}

function auxiliaresGestao() {
  return Object.assign(auxiliares(), { prioridades: mapaPorId('PRIORIDADES') });
}

function ordemUrgencia(a, b) {
  var pa = a.prazos.proximo;
  var pb = b.prazos.proximo;
  var g = (pb ? GRAVIDADE_SITUACAO[pb.situacao] : -1) - (pa ? GRAVIDADE_SITUACAO[pa.situacao] : -1);
  if (g) return g;
  var xa = pa ? pa.prazo : '9999';
  var xb = pb ? pb.prazo : '9999';
  if (xa !== xb) return xa < xb ? -1 : 1;
  return String(a.paciente_nome).localeCompare(String(b.paciente_nome));
}

/**
 * Pacientes internados acompanhados pela psicologia (admissões não encerradas).
 * filtros: { setor_id, unidade_id, termo, incluir_encerrados: 'SIM' para incluir quem teve desfecho
 *            psicológico e segue internado, pendencia: 'ATRASADOS' | 'PENDENTES' | '' }
 */
function apiGestao(filtros) {
  return responder(function () {
    usuarioAtual();
    return dadosDeGestao_(filtros);
  });
}

/** Compartilhado com a abertura inicial; acesso validado pela API chamadora. */
function dadosDeGestao_(filtros) {
    var f = filtros || {};
    if (f.status_atendimento && ['ATIVOS', 'INATIVOS', 'TODOS'].indexOf(f.status_atendimento) === -1) throw new Error('Filtro de situação inválido.');
    var aux = auxiliaresGestao();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var itens = listar('ADMISSOES').filter(function (a) {
      if (f.status_atendimento) {
        var inativa = Boolean(a.desfecho_id) || a.status === STATUS_ADMISSAO.encerrada || a.status === STATUS_ADMISSAO.acompanhamentoEncerrado;
        return f.status_atendimento === 'TODOS' || (f.status_atendimento === 'INATIVOS' ? inativa : !inativa);
      }
      if (a.status === STATUS_ADMISSAO.encerrada) return false;
      if (a.status === STATUS_ADMISSAO.acompanhamentoEncerrado && f.incluir_encerrados !== 'SIM' &&
        !(aux.interconsultasPorAdmissao[a.id] || []).some(function (i) { return i.pendente; })) return false;
      return true;
    }).map(function (a) { return itemDeGestao(a, aux); }).filter(function (a) {
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.pendencia === 'ATRASADOS' && !(a.prazos.proximo && a.prazos.proximo.situacao === 'ATRASADO')) return false;
      if (f.pendencia === 'PENDENTES' && !a.prazos.proximo) return false;
      if (termo && normalizarTexto(a.paciente_nome).indexOf(termo) === -1 &&
        !(prontuario && normalizarProntuario(a.prontuario) === prontuario)) return false;
      return true;
    });
    itens.sort(ordemUrgencia);

    var resumo = { pacientes: itens.length, aguardando_primeiro: 0, interconsultas_pendentes: 0, atrasados: 0, vencem_hoje: 0, vencem_amanha: 0 };
    itens.forEach(function (a) {
      if (a.prazos.primeiro.estado === 'PENDENTE') resumo.aguardando_primeiro++;
      resumo.interconsultas_pendentes += a.interconsultas_pendentes || 0;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'ATRASADO') resumo.atrasados++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'VENCE HOJE') resumo.vencem_hoje++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'VENCE AMANHÃ') resumo.vencem_amanha++;
    });
    return { itens: itens, resumo: resumo, hoje: aux.hoje, agora: aux.agora };
}

/**
 * Interconsultas: uma linha por solicitação, inclusive quando não há prazo configurado.
 * filtros: { situacao: 'PENDENTES' | 'RESPONDIDAS' | 'TODAS', dias (período das respondidas, padrão 30),
 *            setor_id, unidade_id, prioridade }
 */
function apiInterconsultas(filtros) {
  return responder(function () {
    usuarioAtual();
    var f = filtros || {};
    var aux = auxiliaresGestao();
    var dias = Number(f.dias) || 30;
    var desde = adicionarDias(aux.hoje, -dias);
    var itens = aux.interconsultas.map(function (i) {
      var adm = buscarPorId('ADMISSOES', i.admissao_id);
      var unidade = aux.unidades[i.unidade_id] || {};
      return Object.assign({}, resumoAdmissao(adm, aux), i, { id: adm.id, interconsulta_id: i.id,
        unidade_nome: unidade.nome || '', setor_id: unidade.setor_id || '', prazos: { interconsulta: i.prazo } });
    }).filter(function (a) {
      var pendente = a.pendente;
      if (f.situacao === 'PENDENTES' && !pendente) return false;
      if (f.situacao === 'RESPONDIDAS' && !a.momento_resposta) return false;
      if (!pendente && normalizarData(a.data_solicitacao) < desde) return false;
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.prioridade && a.prioridade_solicitacao !== f.prioridade) return false;
      return true;
    });
    itens.sort(function (a, b) {
      var pa = a.pendente ? 0 : 1;
      var pb = b.pendente ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (!pa) return String(a.prazo_resposta || '9999').localeCompare(String(b.prazo_resposta || '9999'));
      return String(b.data_solicitacao + b.hora_solicitacao).localeCompare(String(a.data_solicitacao + a.hora_solicitacao));
    });
    var resumo = { pendentes: 0, atrasadas: 0, respondidas: 0, respondidas_com_prazo: 0, no_prazo: 0 };
    itens.forEach(function (a) {
      var i = a.prazos.interconsulta;
      if (a.pendente) { resumo.pendentes++; if (i.situacao === 'ATRASADO') resumo.atrasadas++; }
      if (i.estado === 'CUMPRIDO') {
        resumo.respondidas++;
        if (a.prazo_resposta) resumo.respondidas_com_prazo++;
        if (i.resultado === 'NO PRAZO') resumo.no_prazo++;
      }
    });
    return { itens: itens, resumo: resumo, dias: dias, agora: aux.agora };
  });
}

// ===== Historico.js =====
/**
 * Histórico completo do paciente: todas as internações, da mais recente para a mais antiga, cada uma com
 * a linha do tempo de solicitações, atendimentos, mudanças de justificativa, transferências e desfechos.
 * Só consulta: nada é gravado.
 */
function apiHistoricoPaciente(pacienteId) {
  return responder(function () {
    usuarioAtual();
    var paciente = buscarPorId('PACIENTES', pacienteId);
    if (!paciente) throw new Error('Paciente não encontrado.');
    var aux = auxiliares();
    var internacoes = listar('ADMISSOES').filter(function (a) { return a.paciente_id === paciente.id; })
      .sort(function (a, b) {
        return String(b.data_admissao).localeCompare(String(a.data_admissao)) || String(b.criado_em).localeCompare(String(a.criado_em));
      })
      .map(function (adm) {
        var det = detalheAdmissao(adm, aux, true);
        return { admissao: det.admissao, eventos: eventosDaInternacao_(det) };
      });
    var contar = function (tipo) {
      return internacoes.reduce(function (n, i) { return n + i.eventos.filter(function (e) { return e.tipo === tipo; }).length; }, 0);
    };
    return {
      paciente: paciente,
      internacoes: internacoes,
      resumo: { internacoes: internacoes.length, atendimentos: contar('ATENDIMENTO'), solicitacoes: contar('SOLICITAÇÃO'),
        desfechos: contar('DESFECHO') }
    };
  });
}

// Ordem dentro do mesmo dia e hora; a lista sai do mais recente para o mais antigo.
var ORDEM_EVENTO_HISTORICO = { 'ENTRADA': 0, 'TRANSFERÊNCIA': 1, 'SOLICITAÇÃO': 2, 'ATENDIMENTO': 3, 'DEMANDA': 4, 'JUSTIFICATIVA': 5,
  'ATIVIDADE': 6, 'DESFECHO': 7, 'RETOMADA': 8 };

/** Linha do tempo de uma internação, a partir do detalhe da admissão (detalheAdmissao). */
function eventosDaInternacao_(det) {
  var adm = det.admissao;
  var eventos = [];
  var incluir = function (tipo, data, hora, campos) {
    if (!data) return;
    eventos.push(Object.assign({ tipo: tipo, data: data, hora: hora || '' }, campos));
  };

  incluir('ENTRADA', adm.data_admissao, '', { unidade_nome: adm.unidade_admissao_nome || adm.unidade_nome, admissao_id: adm.id });

  (det.transferencias || []).forEach(function (t) {
    incluir('TRANSFERÊNCIA', t.data, t.hora, { origem_nome: t.origem_nome, destino_nome: t.destino_nome, profissional_nome: t.profissional_nome });
  });

  (det.interconsultas || []).forEach(function (i) {
    incluir('SOLICITAÇÃO', i.data_solicitacao, i.hora_solicitacao, {
      solicitacao_id: i.id, tipo_solicitacao: i.tipo_solicitacao, motivo_nome: i.motivo_nome,
      prioridade: i.prioridade_solicitacao, para_quem: i.para_quem, familiar_nome: i.familiar_nome,
      familiar_parentesco: i.familiar_parentesco, prazo: i.prazo_resposta, resultado: i.resposta_no_prazo,
      respondida_em: i.momento_resposta, dias_resposta: i.dias_resposta, pendente: Boolean(i.pendente), observacoes: i.observacoes || ''
    });
  });

  // Atendimentos em ordem cronológica, para achar quando a justificativa mudou.
  var anterior = null;
  (det.atendimentos || []).slice().sort(function (a, b) {
    return String(a.data + ' ' + a.hora).localeCompare(String(b.data + ' ' + b.hora)) || String(a.criado_em).localeCompare(String(b.criado_em));
  }).forEach(function (at) {
    var prazo = at.prazo_acompanhamento || {};
    incluir('ATENDIMENTO', at.data, at.hora, {
      atendimento_id: at.id, profissional_nome: at.profissional_nome, categoria: at.categoria, publico: at.publico,
      quantidade: at.quantidade, tipo_atendimento: at.tipo_atendimento, justificativa_nome: at.justificativa_nome,
      unidade_nome: at.unidade_nome, observacao: at.observacao || '',
      tipo_prazo: prazo.tipo || '', prazo: prazo.prazo || '', resultado: prazo.resultado || '',
      interconsultas_respondidas: (at.interconsultas_respondidas || []).map(function (i) { return i.id; })
    });
    if (at.justificativa_id && (!anterior || anterior.justificativa_id !== at.justificativa_id)) {
      incluir('JUSTIFICATIVA', at.data, at.hora, {
        de: anterior ? anterior.justificativa_nome : '', para: at.justificativa_nome, profissional_nome: at.profissional_nome
      });
    }
    if (at.justificativa_id) anterior = at;
  });

  // Descrição da demanda: a do 1º atendimento e cada mudança (na tela da internação ou na transferência).
  var demandaAnterior = '';
  (det.descricoes || []).forEach(function (d) {
    incluir('DEMANDA', d.data, d.hora, { origem: d.origem, descricao: d.descricao, de: demandaAnterior,
      unidade_nome: d.unidade_nome, profissional_nome: d.profissional_nome });
    demandaAnterior = d.descricao;
  });

  (det.atividades || []).forEach(function (a) {
    incluir('ATIVIDADE', a.data, '', { atividade: a.tipo, quantidade: a.quantidade, profissional_nome: a.profissional_nome,
      unidade_nome: a.unidade_nome });
  });

  (det.desfechos || []).forEach(function (d) {
    incluir('DESFECHO', d.data, '', { desfecho_nome: d.desfecho_nome, encerra_admissao: d.encerra_admissao,
      vigente: d.vigente, unidade_nome: d.unidade_nome });
  });

  // Cada retomada deixa uma nota nas observações da admissão; a última também fica em retomado_em.
  var notas = String(adm.observacoes || '').match(/Acompanhamento retomado em \d{2}\/\d{2}\/\d{4} por [^\n(]+\(desfecho anterior: [^\n]*?\)\./g) || [];
  notas.forEach(function (nota) {
    var m = /em (\d{2})\/(\d{2})\/(\d{4}) por ([^(]+?) \(desfecho anterior: (.*?) em/.exec(nota);
    if (m) incluir('RETOMADA', m[3] + '-' + m[2] + '-' + m[1], '', { profissional_nome: m[4], desfecho_anterior: m[5] });
  });
  if (!notas.length && adm.retomado_em) incluir('RETOMADA', normalizarData(adm.retomado_em), '', { profissional_nome: '', desfecho_anterior: '' });

  // Sem hora: a entrada vale do início do dia; desfecho e retomada, do fim.
  var chave = function (e) {
    var hora = e.hora || (e.tipo === 'ENTRADA' ? '00:00' : e.tipo === 'DESFECHO' || e.tipo === 'RETOMADA' ? '23:59' : '12:00');
    return e.data + ' ' + hora;
  };
  return eventos.sort(function (a, b) {
    return chave(b).localeCompare(chave(a)) || ORDEM_EVENTO_HISTORICO[b.tipo] - ORDEM_EVENTO_HISTORICO[a.tipo];
  });
}

// ===== Autoteste.js =====
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

    det = dados(apiRegistrarAtendimento({ tipo_atendimento: 'BUSCA ATIVA', admissao_id: adm.id, data: hojeIso, hora: horaAgora, publico: 'PACIENTE',
      descricao_demanda: 'RISCO DE SUICÍDIO' }), 'Atendimento: registro ao paciente');
    adm = det && det.admissao;
    verificar(adm && adm.descricao_demanda === 'RISCO DE SUICÍDIO', 'Descrição da demanda gravada no 1º atendimento (v27)', adm && adm.descricao_demanda);
    verificar(adm && adm.primeiro_no_prazo === 'SIM', '1º atendimento dentro do prazo da admissão', adm && adm.primeiro_no_prazo);
    verificar(adm && adm.resposta_no_prazo === 'SIM', 'Resposta à solicitação dentro do prazo (1 dia útil)', adm && adm.resposta_no_prazo);
    verificar(adm && adm.proximo_prazo > hojeIso, 'Próximo retorno calculado', adm && adm.proximo_prazo);
    item = daAdmissao(dados(apiInterconsultas({ situacao: 'RESPONDIDAS' }), 'Gestão: interconsultas respondidas'));
    verificar(item && item.prazos.interconsulta.resultado === 'NO PRAZO', 'Gestão: interconsulta respondida no prazo');
    item = daAdmissao(dados(apiGestao({}), 'Gestão: prazos dos pacientes'));
    verificar(item && item.prazos.retorno.estado === 'PENDENTE' && item.prazos.retorno.prazo === adm.proximo_prazo,
      'Gestão: próximo retorno pela matriz de seguimento');

    det = dados(apiRegistrarAtendimento({ tipo_atendimento: 'BUSCA ATIVA', justificativa_id: justificativa.id,
      admissao_id: adm.id, data: hojeIso, hora: horaAgora, publico: 'FAMÍLIA', quantidade: 2
    }), 'Atendimento: registro à família (2 pessoas)');
    verificar(det && det.atendimentos.some(function (a) { return a.publico === 'FAMÍLIA' && a.conta_prazo === 'SIM'; }),
      'Atendimento à família conta para o prazo (v27)');
    det = dados(apiRegistrarAtendimento({ tipo_atendimento: 'SEGUIMENTO PSICOLÓGICO', justificativa_id: justificativa.id,
      admissao_id: adm.id, data: hojeIso, hora: horaAgora, publico: 'PACIENTE E FAMÍLIA', quantidade: 1
    }), 'Atendimento: registro ao paciente e à família');
    verificar(det && det.atendimentos.some(function (a) { return a.publico === 'PACIENTE E FAMÍLIA' && a.conta_prazo === 'SIM'; }),
      'Atendimento ao paciente e à família conta para o prazo (v27)');

    dados(apiRegistrarAtividade({ admissao_id: adm.id, data: hojeIso, tipo: 'DISCUSSÃO DE CASO', quantidade: 1 }), 'Atividade assistencial: registro');
    det = dados(apiMudarDescricaoDemanda({ id: adm.id, descricao_demanda: 'HUMOR DEPRIMIDO OU ANSIOSO', data: hojeIso, hora: horaAgora }),
      'Descrição da demanda: a demanda mudou');
    verificar(det && det.descricoes.length === 2 && det.admissao.descricao_demanda === 'HUMOR DEPRIMIDO OU ANSIOSO',
      'Descrição da demanda: a mudança guarda a anterior', det && det.descricoes.length);

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
    var hist = dados(apiHistoricoPaciente(paciente && paciente.id), 'Histórico completo do paciente');
    var tiposHist = hist && hist.internacoes[0] ? hist.internacoes[0].eventos.map(function (e) { return e.tipo; }) : [];
    verificar(hist && hist.resumo.internacoes === 1 && hist.resumo.atendimentos === 3 && hist.resumo.desfechos === 2 &&
      ['ENTRADA', 'SOLICITAÇÃO', 'ATENDIMENTO', 'JUSTIFICATIVA', 'DESFECHO', 'RETOMADA'].every(function (t) { return tiposHist.indexOf(t) !== -1; }),
      'Histórico: internação, solicitação, atendimentos, justificativa, desfechos e retomada', tiposHist.join(', '));

    dados(apiRegistrarReuniao({ data: hojeIso, unidade_id: unidade.id, tipo: 'GRUPO', quantidade: 1 }), 'Registro do dia: reunião de equipe');
    dados(apiRegistrarGerencial({ data: hojeIso, tipo: 'TREINAMENTO', quantidade: 1 }), 'Registro do dia: atividade gerencial');

    var c = dados(apiCompilado({ ano: hojeIso.slice(0, 4), mes: String(Number(hojeIso.slice(5, 7))), eixo: 'UNIDADE', grupo: 'TODOS' }), 'Compilado mensal');
    var linha = function (secao, rotulo) {
      var s = c && c.secoes.filter(function (x) { return x.titulo.indexOf(secao) === 0; })[0];
      return s && s.linhas.filter(function (l) { return l.rotulo.indexOf(rotulo) === 0; })[0];
    };
    verificar(linha('Atendimentos', 'TOTAL DE PESSOAS') && linha('Atendimentos', 'TOTAL DE PESSOAS').total === 5,
      'Compilado: 5 pessoas atendidas (paciente, 2 familiares, paciente e 1 familiar)', linha('Atendimentos', 'TOTAL DE PESSOAS') && linha('Atendimentos', 'TOTAL DE PESSOAS').total);
    verificar(linha('Desfechos', 'TOTAL') && linha('Desfechos', 'TOTAL').total === 2, 'Compilado: 2 desfechos');
    verificar(linha('Descrição da demanda', 'TOTAL') && linha('Descrição da demanda', 'TOTAL').total === 2,
      'Compilado: as duas descrições da demanda', linha('Descrição da demanda', 'TOTAL') && linha('Descrição da demanda', 'TOTAL').total);
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

// ===== Desempenho.js =====
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
    comparar('Abrir o sistema', function () { return JSON.parse(dadosIniciaisDaPagina()); });
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
      return apiRegistrarAtendimento({ tipo_atendimento: 'BUSCA ATIVA', descricao_demanda: 'HUMOR DEPRIMIDO OU ANSIOSO', admissao_id: adm.id, data: adicionarDias(hojeIso, -1), hora: '08:' + (n < 10 ? '0' : '') + n, publico: 'PACIENTE' });
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
