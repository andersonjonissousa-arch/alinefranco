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
var TIPOS_ATENDIMENTO = ['INTERCONSULTA', 'BUSCA ATIVA', 'ESPONTÂNEA', 'SEGUIMENTO PSICOLÓGICO'];
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
