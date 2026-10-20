/**
 * Configuração central do sistema: tabelas do banco (abas da planilha)
 * e valores iniciais (editáveis depois pela coordenação na tela de cadastros).
 */

var APP = {
  nome: 'Gestão da Psicologia',
  propDbId: 'DB_ID',
  fusoHorario: 'America/Fortaleza'
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
  // Justificativa de acompanhamento e em quantos dias úteis o paciente tem que ser visto de novo.
  JUSTIFICATIVAS: ['id', 'nome', 'prazo_dias_uteis', 'ordem', 'ativo'],
  // Feriados não contam como dia útil no cálculo dos prazos.
  FERIADOS: ['id', 'data', 'descricao'],
  // Desfechos e se cada um encerra a admissão (saída do hospital) ou só o acompanhamento psicológico.
  DESFECHOS: ['id', 'nome', 'encerra_admissao', 'ordem', 'ativo'],
  // Parâmetros do sistema, como o prazo do 1º atendimento após a admissão.
  PARAMETROS: ['id', 'chave', 'valor', 'descricao'],
  PACIENTES: ['id', 'prontuario', 'nome', 'criado_em', 'atualizado_em'],
  // Cada entrada do paciente no hospital. Uma nova admissão só depois que a anterior foi encerrada.
  ADMISSOES: [
    'id', 'paciente_id', 'data_admissao', 'unidade_id',
    // Solicitação
    'tipo_solicitacao', 'descricao_solicitacao', 'prioridade_solicitacao', 'data_solicitacao',
    // Avaliação (o 1º atendimento)
    'descricao_demanda', 'prioridade_demanda',
    // Acompanhamento e desfecho
    'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'retomado_em', 'observacoes',
    // Calculados pelo sistema ao salvar
    'status', 'prazo_primeiro_atendimento', 'primeiro_atendimento', 'primeiro_no_prazo',
    'dias_ate_primeiro_atendimento', 'dias_resposta', 'ultimo_contato', 'proximo_prazo',
    'criado_por', 'criado_em', 'atualizado_em'
  ],
  // Cada atendimento: ao paciente ou à família (com quantas pessoas), por quem, em que unidade e se foi no prazo.
  // tipo_prazo: PRIMEIRO (1º atendimento da admissão) ou RETORNO.
  // Atendimento à família só conta para os prazos quando o paciente estava impossibilitado.
  ATENDIMENTOS: [
    'id', 'admissao_id', 'unidade_id', 'data', 'publico', 'quantidade', 'paciente_impossibilitado', 'conta_prazo',
    'profissional_id', 'categoria', 'justificativa_id', 'tipo_prazo', 'prazo_limite', 'no_prazo', 'observacao',
    'criado_por', 'criado_em'
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
var PUBLICOS_ATENDIMENTO = ['PACIENTE', 'FAMÍLIA'];
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
  ATENDIDO: ['SIM', 'NÃO', 'PENDENTE'],
  DESCRICAO_SOLICITACAO: DESCRICOES_BASE.concat(['TRIAGEM PSICOLÓGICA', 'REABILITA SEPSE']),
  PRIORIDADE_SOLICITACAO: ['ALTA', 'MODERADA', 'BAIXA', 'TRIAGEM', 'SEPSE'],
  DESCRICAO_DEMANDA: DESCRICOES_BASE.concat(['SEM CONDIÇÕES CLÍNICAS E/OU SOCIAIS', 'RECUSA', 'SEM DEMANDA']),
  PRIORIDADE_DEMANDA: ['ALTA', 'MODERADA', 'BAIXA', 'RECUSA', 'SEM DEMANDA', 'SEM CONDIÇÕES CLÍNICAS E/OU SOCIAIS'],
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
  ['PRAZO_PRIMEIRO_ATENDIMENTO_DIAS_UTEIS', '3', 'Dias úteis, a partir da admissão no hospital, para o 1º atendimento (avaliação).']
];

/** Justificativas de acompanhamento. O prazo em dias úteis é preenchido pela coordenação. */
var JUSTIFICATIVAS_INICIAIS = [
  'RISCO DE SUICÍDIO', 'INST. PSIQ. COM RISCO A SI OU A TERCEIROS', 'INST. PSIQ. SEM RISCO A SI OU A TERCEIROS',
  'CUIDADOS PALIATIVOS OU FIM DE VIDA', 'ADESÃO AO TRATAMENTO', 'POUCOS RECURSOS DE ENFRENTAMENTO',
  'BONS A PARCIAIS RECURSOS DE ENFRENTAMENTO', 'INTERNAÇÃO PROLONGADA', 'SEM CONDIÇÕES CLÍNICAS / SOCIAIS'
];

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
