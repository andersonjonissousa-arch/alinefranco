/**
 * Configuração central do sistema: tabelas do banco (abas da planilha)
 * e valores iniciais, extraídos da planilha "2026_GERENCIAMENTO_PSICOLOGIA".
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
  PACIENTES: ['id', 'prontuario', 'nome', 'criado_em', 'atualizado_em'],
  CASOS: [
    'id', 'paciente_id', 'unidade_id', 'profissional_id', 'data_admissao',
    // Solicitação
    'tipo_solicitacao', 'atendido', 'descricao_solicitacao', 'prioridade_solicitacao', 'data_solicitacao',
    // Avaliação
    'descricao_demanda', 'prioridade_demanda', 'data_avaliacao', 'necessidade_reavaliacao',
    // Reavaliação
    'reavaliacao_realizada', 'justificativa_reavaliacao', 'descricao_demanda_reav',
    'prioridade_demanda_reav', 'data_reavaliacao',
    // Acompanhamento e desfecho
    'necessidade_acompanhamento', 'data_encerramento', 'desfecho', 'observacoes',
    // Calculados pelo sistema ao salvar
    'status', 'dias_ate_solicitacao', 'dias_resposta', 'dias_acompanhamento',
    'criado_por', 'criado_em', 'atualizado_em'
  ],
  // Cada atendimento do dia (substitui a grade P/F por dia das abas mensais).
  ATENDIMENTOS: ['id', 'caso_id', 'data', 'publico', 'quantidade', 'profissional_id', 'criado_por', 'criado_em'],
  // Justificativa e conformidade semanal do acompanhamento.
  SEMANAS: ['id', 'caso_id', 'semana_inicio', 'justificativa', 'conformidade', 'profissional_id', 'criado_em', 'atualizado_em'],
  // Atividades assistenciais do caso (ficha de admissão, discussão de caso, visitas...).
  ATIVIDADES: ['id', 'caso_id', 'data', 'tipo', 'quantidade', 'profissional_id', 'criado_em'],
  // Reuniões de equipe por unidade.
  REUNIOES: ['id', 'data', 'unidade_id', 'tipo', 'quantidade', 'profissional_id', 'criado_em'],
  // Atividades gerenciais do serviço.
  GERENCIAIS: ['id', 'data', 'tipo', 'quantidade', 'profissional_id', 'criado_em'],
  PASSAGENS: [
    'id', 'data_solicitacao', 'prontuario', 'nome', 'unidade_id', 'tipo_solicitacao', 'descricao',
    'solicitante_id', 'plantonista_id', 'avaliado', 'justificativa', 'observacao', 'criado_em'
  ]
};

var CATEGORIAS_PROFISSIONAL = ['PSICÓLOGA', 'RESIDENTE', 'ESTAGIÁRIA'];
var PERFIS = ['COORDENAÇÃO', 'PROFISSIONAL'];
var PUBLICOS_ATENDIMENTO = ['PACIENTE', 'FAMÍLIA'];

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
  SIM_NAO_NA: ['SIM', 'NÃO', 'N / A'],
  JUSTIFICATIVA_REAVALIACAO: ['ALTA', 'ÓBITO', 'TRANSFERÊNCIA', 'NOVA DEMANDA', 'CONDIÇÕES CLÍNICAS E/OU SOCIAIS'],
  NECESSIDADE_ACOMPANHAMENTO: ['PACIENTE', 'PACIENTE E FAMÍLIA', 'FAMÍLIA', 'NÃO', 'N / A'],
  JUSTIFICATIVA_ACOMPANHAMENTO: [
    'RISCO DE SUICÍDIO', 'INST. PSIQ. COM RISCO A SI OU A TERCEIROS', 'INST. PSIQ. SEM RISCO A SI OU A TERCEIROS',
    'CUIDADOS PALIATIVOS OU FIM DE VIDA', 'ADESÃO AO TRATAMENTO', 'POUCOS RECURSOS DE ENFRENTAMENTO',
    'BONS A PARCIAIS RECURSOS DE ENFRENTAMENTO', 'INTERNAÇÃO PROLONGADA', 'SEM CONDIÇÕES CLÍNICAS / SOCIAIS', 'N / A'
  ],
  CONFORMIDADE: ['C', 'NC', 'N/A'],
  DESFECHO: ['ALTA', 'ÓBITO', 'TRANSFERÊNCIA', 'SEM CONDIÇÕES CLÍNICAS E/OU SOCIAIS', 'ALTA PSICOLÓGICA', 'RECUSA'],
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
  ],
  PASSAGEM_AVALIADO: ['SIM', 'NÃO'],
  PASSAGEM_JUSTIFICATIVA: ['SOLICITADO', 'NÃO SOLICITADO', 'SEM CONDIÇÕES CLÍNICAS/SOCIAIS']
};

/** Setores e suas unidades, na ordem das abas mensais. */
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
