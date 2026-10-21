// Arquivo gerado por scripts/empacotar.js a partir de src/. Não edite aqui: edite src/ e gere de novo.

// ===== Config.js =====
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
  // Prioridades das duas matrizes, cada uma com seu prazo:
  // tipo SOLICITAÇÃO → prazo em horas corridas para responder à solicitação;
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
  PACIENTES: ['id', 'prontuario', 'nome', 'criado_em', 'atualizado_em'],
  // Cada entrada do paciente no hospital. Uma nova admissão só depois que a anterior foi encerrada.
  ADMISSOES: [
    'id', 'paciente_id', 'data_admissao', 'unidade_id',
    // Solicitação (para o paciente ou para um familiar, com nome e parentesco)
    'tipo_solicitacao', 'motivo_solicitacao_id', 'data_solicitacao', 'hora_solicitacao',
    'para_quem', 'familiar_nome', 'familiar_parentesco',
    // Avaliação (o 1º atendimento)
    'descricao_demanda',
    // Acompanhamento e desfecho
    'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'retomado_em', 'observacoes',
    // Calculados pelo sistema ao salvar
    'status', 'prazo_primeiro_atendimento', 'primeiro_atendimento', 'primeiro_no_prazo',
    'dias_ate_primeiro_atendimento', 'ultimo_contato', 'proximo_prazo', 'prioridade_demanda',
    // Resposta à solicitação, em horas corridas, pela prioridade do motivo
    'prioridade_solicitacao', 'prazo_resposta', 'momento_resposta', 'horas_resposta', 'resposta_no_prazo',
    'criado_por', 'criado_em', 'atualizado_em'
  ],
  // Cada atendimento: ao paciente ou à família (com quantas pessoas), por quem, em que unidade e se foi no prazo.
  // tipo_prazo: PRIMEIRO (1º atendimento da admissão) ou RETORNO.
  // Atendimento à família só conta para os prazos quando o paciente estava impossibilitado.
  ATENDIMENTOS: [
    'id', 'admissao_id', 'unidade_id', 'data', 'hora', 'publico', 'quantidade', 'paciente_impossibilitado', 'conta_prazo',
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
  ['SOLICITAÇÃO', 'ALTA', '24', 'Atender em até 24h'],
  ['SOLICITAÇÃO', 'MODERADA', '48', 'Atender em até 48h'],
  ['SOLICITAÇÃO', 'BAIXA', '72', 'Atender em até 72h'],
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
  ['SEM CONDIÇÕES CLÍNICAS / SOCIAIS', '']
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
function validarAdmissao(adm, hojeIso) {
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
  if (acompanha && !adm.justificativa_id) erros.push('Informe a justificativa do acompanhamento.');
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

/** Atendimento ao paciente sempre conta para os prazos; à família, só se o paciente estava impossibilitado. */
function contaParaPrazo(atendimento) {
  if (atendimento.publico === 'PACIENTE') return true;
  return atendimento.publico === 'FAMÍLIA' && atendimento.paciente_impossibilitado === 'SIM';
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
    var acompanha = adm.necessidade_acompanhamento && SEM_ACOMPANHAMENTO.indexOf(adm.necessidade_acompanhamento) === -1;
    var prazoAtual = prazoDaJustificativa(op.prazos, adm.justificativa_id);
    if (acompanha && prazoAtual !== null) proximo = adicionarDiasUteis(ultimo, prazoAtual, feriados);
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

/** Como está o prazo do próximo atendimento em relação a hoje. */
function situacaoPrazo(proximoPrazo, hoje) {
  var p = normalizarData(proximoPrazo);
  var h = normalizarData(hoje);
  if (!p || !h) return '';
  if (p < h) return 'ATRASADO';
  if (p === h) return 'VENCE HOJE';
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

/**
 * Resposta à solicitação (matriz de atendimento): o primeiro atendimento depois da solicitação
 * tem que acontecer em até N horas corridas, conforme a prioridade do motivo.
 * Solicitação para o paciente: vale atendimento ao paciente, ou à família com o paciente impossibilitado.
 * Solicitação para um familiar: vale atendimento ao paciente ou à família.
 *
 * @param adm a admissão
 * @param atendimentos atendimentos da admissão (data, hora, publico, paciente_impossibilitado)
 * @param op { prioridade: { nome, prazo } ou null, tiposComPrazo: [tipos], agora: 'AAAA-MM-DD HH:MM' }
 * @return { prioridade_solicitacao, prazo_resposta, momento_resposta, horas_resposta, resposta_no_prazo }
 *   resposta_no_prazo: SIM, NÃO, EM ANDAMENTO, NÃO SE APLICA (desfecho antes do prazo sem resposta),
 *   SEM PRAZO (tipo ou motivo sem prazo) ou '' (sem solicitação).
 */
function calcularResposta(adm, atendimentos, op) {
  var vazio = { prioridade_solicitacao: '', prazo_resposta: '', momento_resposta: '', horas_resposta: '', resposta_no_prazo: '' };
  var inicio = normalizarHora(adm.hora_solicitacao) ? dataHora(adm.data_solicitacao, adm.hora_solicitacao) : '';
  if (!inicio) return vazio;

  var prioridade = op.prioridade;
  var horasPrazo = prioridade && prioridade.prazo !== '' && !isNaN(Number(prioridade.prazo)) ? Number(prioridade.prazo) : null;
  var temPrazo = horasPrazo !== null && (op.tiposComPrazo || []).indexOf(adm.tipo_solicitacao) !== -1;
  var paraFamiliar = adm.para_quem === 'FAMILIAR';

  var resposta = '';
  atendimentos.forEach(function (a) {
    var dh = dataHora(a.data, a.hora);
    if (!dh || dh < inicio) return;
    var vale = paraFamiliar ? (a.publico === 'PACIENTE' || a.publico === 'FAMÍLIA') : contaParaPrazo(a);
    if (vale && (!resposta || dh < resposta)) resposta = dh;
  });

  var prazo = temPrazo ? adicionarHoras(inicio, horasPrazo) : '';
  var situacao;
  if (!temPrazo) situacao = 'SEM PRAZO';
  else if (resposta) situacao = resposta <= prazo ? 'SIM' : 'NÃO';
  else {
    var desfecho = normalizarData(adm.data_desfecho);
    if (desfecho && desfecho <= prazo.slice(0, 10)) situacao = 'NÃO SE APLICA';
    else if (desfecho || (op.agora && op.agora > prazo)) situacao = 'NÃO';
    else situacao = 'EM ANDAMENTO';
  }
  return {
    prioridade_solicitacao: prioridade ? prioridade.nome : '',
    prazo_resposta: prazo,
    momento_resposta: resposta,
    horas_resposta: resposta ? horasEntre(inicio, resposta) : '',
    resposta_no_prazo: situacao
  };
}

/** Situação de um prazo com hora ('AAAA-MM-DD HH:MM') em relação a agora. */
function situacaoPrazoHora(prazo, agora) {
  if (!prazo || !agora) return '';
  if (prazo < agora) return 'ATRASADO';
  if (prazo.slice(0, 10) === agora.slice(0, 10)) return 'VENCE HOJE';
  return 'NO PRAZO';
}

var GRAVIDADE_SITUACAO = { 'ATRASADO': 3, 'VENCE HOJE': 2, 'NO PRAZO': 1, '': 0 };

/** A mais urgente de duas situações. */
function situacaoMaisUrgente(a, b) {
  return (GRAVIDADE_SITUACAO[a || ''] || 0) >= (GRAVIDADE_SITUACAO[b || ''] || 0) ? (a || '') : (b || '');
}

// ---------- Gestão: os três prazos de uma admissão ----------

/**
 * Situação de cada prazo da admissão, para as telas de gestão:
 * 1º atendimento após a admissão, resposta à interconsulta e próximo retorno do seguimento.
 * Cada um: { estado: PENDENTE | CUMPRIDO | NÃO REALIZADO | NÃO SE APLICA | SEM PRAZO | '', prazo,
 *            situacao (se pendente): ATRASADO | VENCE HOJE | NO PRAZO, resultado (se cumprido): NO PRAZO | FORA DO PRAZO }
 * proximo: o prazo pendente mais urgente ({ tipo, prazo, situacao }) ou null.
 */
function prazosDaAdmissao(adm, hojeIso, agoraDh) {
  var ativa = adm.status !== STATUS_ADMISSAO.encerrada && !adm.desfecho_id;

  var primeiro = { prazo: adm.prazo_primeiro_atendimento || '' };
  if (adm.primeiro_no_prazo === 'NÃO SE APLICA') primeiro.estado = 'NÃO SE APLICA';
  else if (adm.primeiro_atendimento) {
    primeiro.estado = 'CUMPRIDO';
    primeiro.realizado = adm.primeiro_atendimento;
    primeiro.resultado = adm.primeiro_no_prazo === 'SIM' ? 'NO PRAZO' : 'FORA DO PRAZO';
  } else if (ativa) {
    primeiro.estado = 'PENDENTE';
    primeiro.situacao = situacaoPrazo(primeiro.prazo, hojeIso);
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
    interconsulta.horas = adm.horas_resposta;
    interconsulta.resultado = r === 'SIM' ? 'NO PRAZO' : 'FORA DO PRAZO';
  } else if (ativa) {
    interconsulta.estado = 'PENDENTE';
    interconsulta.situacao = situacaoPrazoHora(interconsulta.prazo, agoraDh);
    interconsulta.horas_restantes = horasEntre(agoraDh, interconsulta.prazo);
  } else {
    interconsulta.estado = 'NÃO REALIZADO';
    interconsulta.resultado = 'FORA DO PRAZO';
  }

  var retorno = { prazo: '', prioridade: adm.prioridade_demanda || '', ultimo: adm.ultimo_contato || '' };
  if (adm.status !== STATUS_ADMISSAO.acompanhamento || adm.desfecho_id) retorno.estado = '';
  else if (adm.proximo_prazo) {
    retorno.estado = 'PENDENTE';
    retorno.prazo = adm.proximo_prazo;
    retorno.situacao = situacaoPrazo(retorno.prazo, hojeIso);
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
  var lFamImp = linhaCompilado('… com paciente impossibilitado');
  var lTot = linhaCompilado('TOTAL DE PESSOAS ATENDIDAS');
  lTot.destaque = true;
  atend.forEach(function (a) {
    var c = chave(a.data, a.unidade_id);
    if (a.publico === 'PACIENTE') {
      acumular(lPac, c, 1);
      acumular(lTot, c, 1);
    } else {
      acumular(lFam, c, qtd(a));
      acumular(lFamAt, c, 1);
      if (a.paciente_impossibilitado === 'SIM') acumular(lFamImp, c, 1);
      acumular(lTot, c, qtd(a));
    }
  });
  secao('Atendimentos', [lPac, lFam, lFamAt, lFamImp, lTot]);

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
  var comSolicitacao = function (a) { return Boolean(a.motivo_solicitacao_id || a.data_solicitacao); };
  [
    ['Tipo de solicitação', function (a) { return a.tipo_solicitacao; }, listas.TIPO_SOLICITACAO, adms],
    ['Motivo da solicitação', function (a) { return (motivos[a.motivo_solicitacao_id] || {}).nome; },
      (dados.motivos || []).map(function (m) { return m.nome; }), adms.filter(comSolicitacao)],
    ['Prioridade da solicitação', function (a) { return a.prioridade_solicitacao || 'SEM PRIORIDADE'; },
      nomesPrioridade(TIPOS_PRIORIDADE.solicitacao), adms.filter(comSolicitacao)],
    ['Solicitação para', function (a) { return a.para_quem; }, PARA_QUEM_SOLICITACAO, adms.filter(comSolicitacao)],
    ['Descrição da demanda', function (a) { return a.descricao_demanda; }, listas.DESCRICAO_DEMANDA, adms],
    ['Prioridade da demanda (seguimento)', function (a) { return a.prioridade_demanda || 'SEM PRIORIDADE'; },
      nomesPrioridade(TIPOS_PRIORIDADE.seguimento), adms],
    ['Necessidade de acompanhamento', function (a) { return a.necessidade_acompanhamento; }, listas.NECESSIDADE_ACOMPANHAMENTO, adms]
  ].forEach(function (d) {
    secao(d[0], distribuicao(d[3], d[1], d[2], chaveAdm), { nota: notaServico });
  });

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
  var sols = dados.admissoes.filter(function (a) { return a.resposta_no_prazo && aceita(a.data_solicitacao, a.unidade_id); });
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
  var rMedia = linhaCompilado('MÉDIA DE HORAS ATÉ A RESPOSTA', 'media');
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
    if (a.horas_resposta !== '' && a.horas_resposta !== undefined && a.resposta_no_prazo !== 'SEM PRAZO') {
      acumular(rMedia, c, Number(a.horas_resposta));
    }
    var pp = porPrioridade[a.prioridade_solicitacao];
    if (pp && a.resposta_no_prazo === 'SIM') acumular(pp.sim, c, 1);
    if (pp && a.resposta_no_prazo === 'NÃO') acumular(pp.nao, c, 1);
  });
  var linhasPorPrioridade = ordemPrioridade.map(function (n) { return porPrioridade[n].pct; });
  secao('Resposta à solicitação no prazo da prioridade', [rSim, rNao, rAnd, rNsa, rSem, rPct].concat(linhasPorPrioridade).concat([rMedia]), {
    nota: [notaServico, 'Horas corridas entre a solicitação e o primeiro atendimento depois dela, pela data da solicitação.']
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
    nota: 'Atendimentos de acompanhamento que contam para o prazo (paciente, ou família com paciente impossibilitado).'
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

// ===== Db.js =====
/**
 * Acesso às abas do banco como tabelas. Cada linha vira um objeto
 * cujas chaves são os nomes das colunas definidos em TABELAS.
 */

var _cacheTabelas = {};

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

/** Todas as linhas da tabela, como objetos. Lê a aba uma vez por execução. */
function listar(nome) {
  if (_cacheTabelas[nome]) return _cacheTabelas[nome];
  var colunas = TABELAS[nome];
  var aba = abaDaTabela(nome);
  var ultima = aba.getLastRow();
  var linhas = ultima < 2 ? [] : aba.getRange(2, 1, ultima - 1, colunas.length).getValues();
  var registros = [];
  linhas.forEach(function (linha) {
    if (linha[0] === '') return;
    var obj = {};
    colunas.forEach(function (col, i) {
      obj[col] = linha[i] instanceof Date ? normalizarDataHora(col, linha[i]) : linha[i];
    });
    registros.push(obj);
  });
  _cacheTabelas[nome] = registros;
  return registros;
}

/** Datas lidas da planilha voltam como texto: 'AAAA-MM-DD' ou data e hora ISO nos carimbos *_em. */
function normalizarDataHora(coluna, valor) {
  if (/_em$/.test(coluna)) return valor.toISOString();
  if (/^hora/.test(coluna)) return normalizarHora(valor);
  return normalizarData(valor);
}

function buscarPorId(nome, id) {
  var lista = listar(nome);
  for (var i = 0; i < lista.length; i++) {
    if (String(lista[i].id) === String(id)) return lista[i];
  }
  return null;
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

/** Insere o registro (gera id se faltar) e devolve o registro gravado. */
function inserir(nome, registro) {
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var obj = Object.assign({}, registro);
    if (!obj.id) obj.id = novoId();
    if (colunas.indexOf('criado_em') !== -1 && !obj.criado_em) obj.criado_em = agoraIso();
    abaDaTabela(nome).appendRow(linhaDe(colunas, obj));
    delete _cacheTabelas[nome];
    return obj;
  });
}

/** Atualiza só os campos enviados do registro com esse id. */
function atualizar(nome, id, campos) {
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var aba = abaDaTabela(nome);
    var linha = numeroDaLinha(aba, id);
    if (!linha) throw new Error('Registro não encontrado: ' + id);
    var atual = aba.getRange(linha, 1, 1, colunas.length).getValues()[0];
    var obj = {};
    colunas.forEach(function (col, i) { obj[col] = atual[i]; });
    Object.keys(campos).forEach(function (col) {
      if (col !== 'id' && colunas.indexOf(col) !== -1) obj[col] = campos[col];
    });
    if (colunas.indexOf('atualizado_em') !== -1) obj.atualizado_em = agoraIso();
    aba.getRange(linha, 1, 1, colunas.length).setValues([linhaDe(colunas, obj)]);
    delete _cacheTabelas[nome];
    return obj;
  });
}

/** Atualiza vários registros de uma vez: { id: { campo: valor } }. Lê e grava a aba uma vez só. */
function atualizarVarios(nome, mudancas) {
  var ids = Object.keys(mudancas);
  if (!ids.length) return 0;
  return comTrava(function () {
    var colunas = TABELAS[nome];
    var aba = abaDaTabela(nome);
    var ultima = aba.getLastRow();
    if (ultima < 2) return 0;
    var intervalo = aba.getRange(2, 1, ultima - 1, colunas.length);
    var valores = intervalo.getValues();
    var alteradas = 0;
    valores.forEach(function (linha) {
      var campos = mudancas[String(linha[0])];
      if (!campos) return;
      Object.keys(campos).forEach(function (col) {
        var i = colunas.indexOf(col);
        if (i > 0) linha[i] = campos[col] === undefined || campos[col] === null ? '' : campos[col];
      });
      alteradas++;
    });
    if (alteradas) intervalo.setValues(valores);
    delete _cacheTabelas[nome];
    return alteradas;
  });
}

function excluir(nome, id) {
  return comTrava(function () {
    var aba = abaDaTabela(nome);
    var linha = numeroDaLinha(aba, id);
    if (!linha) throw new Error('Registro não encontrado: ' + id);
    aba.deleteRow(linha);
    delete _cacheTabelas[nome];
    return true;
  });
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

/** Garante que duas pessoas não gravem na mesma aba ao mesmo tempo. */
function comTrava(fn) {
  var trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    return fn();
  } finally {
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
  var banco = obterOuCriarBanco();
  Object.keys(TABELAS).forEach(function (nome) { prepararAba(banco, nome); });
  removerAbaPadrao(banco);
  semearSetoresEUnidades();
  semearListas();
  semearMatrizes();
  semearFeriados();
  semearDesfechos();
  semearParametros();
  semearCoordenacao();
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
  return HtmlService.createTemplateFromFile('ui/Index')
    .evaluate()
    .setTitle(APP.nome)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
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

// ===== Api.js =====
/**
 * Funções chamadas pela tela via google.script.run.
 * Todas passam por responder() e conferem o acesso do usuário.
 */

function porOrdem(a, b) {
  return Number(a.ordem || 0) - Number(b.ordem || 0);
}

/** Tudo o que a tela precisa para abrir: usuário, listas, setores, unidades e profissionais. */
function apiInicio() {
  return responder(function () {
    var usuario = usuarioAtual();
    return Object.assign({ usuario: usuario }, dadosDeCadastro(usuario.perfil === 'COORDENAÇÃO'));
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
  return {
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
    hoje: hoje()
  };
}

// ---------- Pacientes ----------

function apiBuscarPacientes(termo) {
  return responder(function () {
    usuarioAtual();
    return filtrarPacientes(listar('PACIENTES'), termo, 20);
  });
}

function apiSalvarPaciente(dados) {
  return responder(function () {
    usuarioAtual();
    var paciente = {
      id: dados.id || '',
      prontuario: normalizarProntuario(dados.prontuario),
      nome: formatarNome(dados.nome)
    };
    if (!paciente.prontuario) throw new Error('Informe o prontuário (somente números).');
    if (!paciente.nome) throw new Error('Informe o nome do paciente.');
    var duplicado = acharDuplicado(listar('PACIENTES'), paciente);
    if (duplicado) throw new Error('Já existe paciente com o prontuário ' + paciente.prontuario + ': ' + duplicado.nome + '.');
    if (paciente.id) return atualizar('PACIENTES', paciente.id, paciente);
    return inserir('PACIENTES', paciente);
  });
}

// ---------- Cadastros da coordenação ----------

function apiSalvarProfissional(dados) {
  return responder(function () {
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
  return responder(function () {
    exigirCoordenacao();
    var setor = { nome: formatarNome(dados.nome), ordem: Number(dados.ordem) || 99, ativo: dados.ativo === 'NÃO' ? 'NÃO' : 'SIM' };
    if (!setor.nome) throw new Error('Informe o nome do setor.');
    if (dados.id) atualizar('SETORES', dados.id, setor);
    else inserir('SETORES', setor);
    return dadosDeCadastro(true);
  });
}

function apiSalvarUnidade(dados) {
  return responder(function () {
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
  return responder(function () {
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
  return responder(function () {
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
  return responder(function () {
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

/** Prioridade de solicitação (prazo em horas) ou de seguimento (prazo em dias úteis). */
function apiSalvarPrioridade(dados) {
  return responder(function () {
    exigirCoordenacao();
    var tipos = [TIPOS_PRIORIDADE.solicitacao, TIPOS_PRIORIDADE.seguimento];
    var atual = dados.id ? buscarPorId('PRIORIDADES', dados.id) : null;
    var tipo = atual ? atual.tipo : dados.tipo;
    if (tipos.indexOf(tipo) === -1) throw new Error('Escolha se a prioridade é de solicitação ou de seguimento.');
    var prazo = String(dados.prazo === undefined ? '' : dados.prazo).trim();
    if (!/^\d+$/.test(prazo) || Number(prazo) < 1) {
      throw new Error(tipo === TIPOS_PRIORIDADE.solicitacao ? 'O prazo deve ser um número inteiro de horas.' : 'O prazo deve ser um número inteiro de dias úteis.');
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
  return responder(function () {
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
  return responder(function () {
    exigirCoordenacao();
    excluir('FERIADOS', id);
    recalcularAdmissoesAbertas();
    return dadosDeCadastro(true);
  });
}

function apiSalvarDesfecho(dados) {
  return responder(function () {
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
  return responder(function () {
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
      prioridade: prioridadeDe(buscarPorId('MOTIVOS_SOLICITACAO', adm.motivo_solicitacao_id)),
      tiposComPrazo: tipos,
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
  return {
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
  var paciente = aux.pacientes[adm.paciente_id] || {};
  var unidade = aux.unidades[adm.unidade_id] || {};
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var desfecho = aux.desfechos[adm.desfecho_id] || {};
  var motivo = aux.motivos[adm.motivo_solicitacao_id] || {};
  // Aguardando resposta à solicitação: o prazo em horas também entra na situação.
  var aguardandoResposta = adm.resposta_no_prazo === 'EM ANDAMENTO' ||
    (adm.resposta_no_prazo === 'NÃO' && !adm.momento_resposta && !adm.desfecho_id);
  var situacaoResposta = aguardandoResposta ? situacaoPrazoHora(adm.prazo_resposta, aux.agora) : '';
  var situacaoRetorno = adm.proximo_prazo ? situacaoPrazo(adm.proximo_prazo, aux.hoje) : '';
  return Object.assign({}, adm, {
    paciente_nome: paciente.nome || '',
    prontuario: paciente.prontuario || '',
    unidade_nome: unidade.nome || '',
    setor_id: unidade.setor_id || '',
    justificativa_nome: justificativa.nome || '',
    desfecho_nome: desfecho.nome || '',
    motivo_nome: motivo.nome || '',
    aguardando_resposta: aguardandoResposta,
    aberta: adm.status !== STATUS_ADMISSAO.encerrada,
    situacao: situacaoMaisUrgente(situacaoResposta, situacaoRetorno)
  });
}

var ORDEM_SITUACAO = { 'ATRASADO': 0, 'VENCE HOJE': 1, 'NO PRAZO': 2, '': 3 };

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

function detalheAdmissao(adm) {
  var aux = auxiliares();
  var nomeProf = function (pid) { return (aux.profissionais[pid] || {}).nome || ''; };
  var porData = function (a, b) {
    return String(b.data).localeCompare(String(a.data)) || String(b.hora || '').localeCompare(String(a.hora || '')) ||
      String(b.criado_em).localeCompare(String(a.criado_em));
  };
  var daAdmissao = function (tabela) {
    return listar(tabela).filter(function (a) { return a.admissao_id === adm.id; }).sort(porData)
      .map(function (a) { return Object.assign({ profissional_nome: nomeProf(a.profissional_id) }, a); });
  };
  var anteriores = listar('ADMISSOES').filter(function (a) { return a.paciente_id === adm.paciente_id && a.id !== adm.id; })
    .map(function (a) { return resumoAdmissao(a, aux); })
    .sort(function (a, b) { return String(b.data_admissao).localeCompare(String(a.data_admissao)); });
  return {
    admissao: resumoAdmissao(adm, aux),
    paciente: aux.pacientes[adm.paciente_id] || null,
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
  return responder(function () {
    var usuario = usuarioAtual();
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

    var erros = validarAdmissao(adm, hoje());
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
  });
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
    unidade_id: adm.unidade_id,
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
  return responder(function () {
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
  return responder(function () {
    var usuario = usuarioAtual();
    var adm = admissaoParaRegistro(dados.admissao_id);
    var data = normalizarData(dados.data);
    validarDataRegistro(data, adm);
    var hora = normalizarHora(dados.hora);
    if (!hora) throw new Error('Informe a hora do atendimento.');
    if (dataHora(data, hora) > agora()) throw new Error('O atendimento não pode estar no futuro.');
    if (PUBLICOS_ATENDIMENTO.indexOf(dados.publico) === -1) throw new Error('Escolha se o atendimento foi ao paciente ou à família.');
    var familia = dados.publico === 'FAMÍLIA';
    var quantidade = familia ? inteiroEntre(dados.quantidade, 1, 30, 1) : 1;
    if (quantidade === null) throw new Error('Informe quantos familiares foram atendidos (1 a 30).');
    var impossibilitado = familia && dados.paciente_impossibilitado === 'SIM' ? 'SIM' : 'NÃO';
    var prof = profissionalDoRegistro(dados.profissional_id, usuario);
    var atendimento = {
      admissao_id: adm.id,
      unidade_id: adm.unidade_id,
      data: data,
      hora: hora,
      publico: dados.publico,
      quantidade: quantidade,
      paciente_impossibilitado: familia ? impossibilitado : '',
      profissional_id: prof.id,
      categoria: prof.categoria,
      justificativa_id: adm.justificativa_id,
      observacao: String(dados.observacao || '').trim(),
      criado_por: usuario.id
    };
    atendimento.conta_prazo = contaParaPrazo(atendimento) ? 'SIM' : 'NÃO';
    inserir('ATENDIMENTOS', atendimento);
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
  return responder(function () {
    var usuario = usuarioAtual();
    var atendimento = buscarPorId('ATENDIMENTOS', id);
    if (!atendimento) throw new Error('Atendimento não encontrado.');
    exigirAutorOuCoordenacao(atendimento, usuario);
    excluir('ATENDIMENTOS', id);
    return detalheAdmissao(recalcularAdmissao(atendimento.admissao_id));
  });
}

function apiRegistrarAtividade(dados) {
  return responder(function () {
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
      admissao_id: adm.id, unidade_id: adm.unidade_id, data: data, tipo: dados.tipo, quantidade: quantidade,
      profissional_id: prof.id, categoria: prof.categoria, criado_por: usuario.id
    });
    return detalheAdmissao(adm);
  });
}

function apiExcluirAtividade(id) {
  return responder(function () {
    var usuario = usuarioAtual();
    var atividade = buscarPorId('ATIVIDADES', id);
    if (!atividade) throw new Error('Atividade não encontrada.');
    exigirAutorOuCoordenacao(atividade, usuario);
    excluir('ATIVIDADES', id);
    return detalheAdmissao(buscarPorId('ADMISSOES', atividade.admissao_id));
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
  return responder(function () {
    var usuario = usuarioAtual();
    var registro = dadosRegistroGeral(dados, usuario, 'REUNIAO_EQUIPE');
    if (!buscarPorId('UNIDADES', dados.unidade_id)) throw new Error('Escolha a unidade.');
    registro.unidade_id = dados.unidade_id;
    inserir('REUNIOES', registro);
    return registrosDoMes(dados.data);
  });
}

function apiRegistrarGerencial(dados) {
  return responder(function () {
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
  return responder(function () {
    var usuario = usuarioAtual();
    var r = buscarPorId('REUNIOES', id);
    if (!r) throw new Error('Registro não encontrado.');
    exigirAutorOuCoordenacao(r, usuario);
    excluir('REUNIOES', id);
    return registrosDoMes(r.data);
  });
}

function apiExcluirGerencial(id) {
  return responder(function () {
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
  return Object.assign(r, {
    prazos: prazosDaAdmissao(adm, aux.hoje, aux.agora),
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
    var f = filtros || {};
    var aux = auxiliaresGestao();
    var termo = normalizarTexto(f.termo);
    var prontuario = normalizarProntuario(f.termo);
    var itens = listar('ADMISSOES').filter(function (a) {
      if (a.status === STATUS_ADMISSAO.encerrada) return false;
      if (a.status === STATUS_ADMISSAO.acompanhamentoEncerrado && f.incluir_encerrados !== 'SIM') return false;
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

    var resumo = { pacientes: itens.length, aguardando_primeiro: 0, interconsultas_pendentes: 0, atrasados: 0, vencem_hoje: 0 };
    itens.forEach(function (a) {
      if (a.prazos.primeiro.estado === 'PENDENTE') resumo.aguardando_primeiro++;
      if (a.prazos.interconsulta.estado === 'PENDENTE') resumo.interconsultas_pendentes++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'ATRASADO') resumo.atrasados++;
      if (a.prazos.proximo && a.prazos.proximo.situacao === 'VENCE HOJE') resumo.vencem_hoje++;
    });
    return { itens: itens, resumo: resumo, hoje: aux.hoje, agora: aux.agora };
  });
}

/**
 * Interconsultas (solicitações com prazo de resposta).
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
    var itens = listar('ADMISSOES').filter(function (a) {
      return a.resposta_no_prazo && a.resposta_no_prazo !== 'SEM PRAZO';
    }).map(function (a) { return itemDeGestao(a, aux); }).filter(function (a) {
      var pendente = a.prazos.interconsulta.estado === 'PENDENTE';
      if (f.situacao === 'PENDENTES' && !pendente) return false;
      if (f.situacao === 'RESPONDIDAS' && pendente) return false;
      if (!pendente && normalizarData(a.data_solicitacao) < desde) return false;
      if (f.setor_id && a.setor_id !== f.setor_id) return false;
      if (f.unidade_id && a.unidade_id !== f.unidade_id) return false;
      if (f.prioridade && a.prioridade_solicitacao !== f.prioridade) return false;
      return true;
    });
    itens.sort(function (a, b) {
      var pa = a.prazos.interconsulta.estado === 'PENDENTE' ? 0 : 1;
      var pb = b.prazos.interconsulta.estado === 'PENDENTE' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (!pa) return a.prazo_resposta < b.prazo_resposta ? -1 : 1;
      return String(b.data_solicitacao + b.hora_solicitacao).localeCompare(String(a.data_solicitacao + a.hora_solicitacao));
    });
    var resumo = { pendentes: 0, atrasadas: 0, respondidas: 0, no_prazo: 0 };
    itens.forEach(function (a) {
      var i = a.prazos.interconsulta;
      if (i.estado === 'PENDENTE') { resumo.pendentes++; if (i.situacao === 'ATRASADO') resumo.atrasadas++; }
      if (i.estado === 'CUMPRIDO') { resumo.respondidas++; if (i.resultado === 'NO PRAZO') resumo.no_prazo++; }
    });
    return { itens: itens, resumo: resumo, dias: dias, agora: aux.agora };
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
