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
      dias_resposta: diasEntre(adm.data_solicitacao, primeiro),
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
 * @param dados { unidades, admissoes, atendimentos, atividades, reunioes, gerenciais,
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
  [
    ['Tipo de solicitação', 'tipo_solicitacao', 'TIPO_SOLICITACAO'],
    ['Descrição da solicitação', 'descricao_solicitacao', 'DESCRICAO_SOLICITACAO'],
    ['Prioridade da solicitação', 'prioridade_solicitacao', 'PRIORIDADE_SOLICITACAO'],
    ['Descrição da demanda', 'descricao_demanda', 'DESCRICAO_DEMANDA'],
    ['Prioridade da demanda', 'prioridade_demanda', 'PRIORIDADE_DEMANDA'],
    ['Necessidade de acompanhamento', 'necessidade_acompanhamento', 'NECESSIDADE_ACOMPANHAMENTO']
  ].forEach(function (d) {
    secao(d[0], distribuicao(adms, function (a) { return a[d[1]]; }, listas[d[2]], chaveAdm), { nota: notaServico });
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

  // 5. Desfechos no período
  var comDesfecho = dados.admissoes.filter(function (a) { return a.desfecho_id && aceita(a.data_desfecho, a.unidade_id); });
  secao('Desfechos', distribuicao(comDesfecho, function (a) { return (desfechos[a.desfecho_id] || {}).nome; },
    (dados.desfechos || []).map(function (d) { return d.nome; }),
    function (a) { return chave(a.data_desfecho, a.unidade_id); }), { nota: notaServico });

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

function abrirBanco() {
  var id = PropertiesService.getScriptProperties().getProperty(APP.propDbId);
  if (id) return SpreadsheetApp.openById(id);
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (!ativa) throw new Error('Banco não configurado. Rode a função "configurar" no editor do Apps Script.');
  return ativa;
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
  semearJustificativas();
  semearFeriados();
  semearDesfechos();
  semearParametros();
  semearCoordenacao();
  Logger.log('Banco pronto: ' + banco.getUrl());
  return banco.getUrl();
}

function obterOuCriarBanco() {
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

function semearJustificativas() {
  if (listar('JUSTIFICATIVAS').length) return;
  JUSTIFICATIVAS_INICIAIS.forEach(function (nome, i) {
    inserir('JUSTIFICATIVAS', { nome: nome, prazo_dias_uteis: '', ordem: i + 1, ativo: 'SIM' });
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

/**
 * Envolve cada chamada da tela: devolve { ok: true, dados } ou { ok: false, erro }.
 * Assim a tela sempre mostra uma mensagem clara em vez de um erro técnico.
 */
function responder(fn) {
  try {
    return { ok: true, dados: fn() };
  } catch (e) {
    console.error(e);
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

function apiSalvarJustificativa(dados) {
  return responder(function () {
    exigirCoordenacao();
    var prazo = String(dados.prazo_dias_uteis === undefined ? '' : dados.prazo_dias_uteis).trim();
    if (prazo !== '' && !/^\d+$/.test(prazo)) throw new Error('O prazo deve ser um número inteiro de dias úteis.');
    var item = {
      nome: formatarNome(dados.nome),
      prazo_dias_uteis: prazo,
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
  'paciente_id', 'data_admissao', 'unidade_id', 'tipo_solicitacao', 'descricao_solicitacao',
  'prioridade_solicitacao', 'data_solicitacao', 'descricao_demanda', 'prioridade_demanda',
  'necessidade_acompanhamento', 'justificativa_id', 'desfecho_id', 'data_desfecho', 'observacoes'
];
var CAMPOS_DATA_ADMISSAO = ['data_admissao', 'data_solicitacao', 'data_desfecho'];

function mapaPorId(nome) {
  var mapa = {};
  listar(nome).forEach(function (x) { mapa[x.id] = x; });
  return mapa;
}

function prazosPorJustificativa() {
  var prazos = {};
  listar('JUSTIFICATIVAS').forEach(function (j) { prazos[j.id] = j.prazo_dias_uteis; });
  return prazos;
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
  var atendimentos = listar('ATENDIMENTOS');
  var mudancasAdm = {};
  var mudancasAtend = {};
  ids.forEach(function (id) {
    var adm = buscarPorId('ADMISSOES', id);
    if (!adm) return;
    var daAdmissao = atendimentos.filter(function (a) { return a.admissao_id === id; });
    var r = calcularAdmissao(adm, daAdmissao, Object.assign({ desfechoEncerra: desfechoEncerraAdmissao(adm.desfecho_id) }, op));
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
    desfechos: mapaPorId('DESFECHOS'),
    profissionais: mapaPorId('PROFISSIONAIS'),
    hoje: hoje()
  };
}

/** Admissão com os nomes que a tela mostra e a situação do próximo prazo. */
function resumoAdmissao(adm, aux) {
  var paciente = aux.pacientes[adm.paciente_id] || {};
  var unidade = aux.unidades[adm.unidade_id] || {};
  var justificativa = aux.justificativas[adm.justificativa_id] || {};
  var desfecho = aux.desfechos[adm.desfecho_id] || {};
  return Object.assign({}, adm, {
    paciente_nome: paciente.nome || '',
    prontuario: paciente.prontuario || '',
    unidade_nome: unidade.nome || '',
    setor_id: unidade.setor_id || '',
    justificativa_nome: justificativa.nome || '',
    desfecho_nome: desfecho.nome || '',
    aberta: adm.status !== STATUS_ADMISSAO.encerrada,
    situacao: adm.proximo_prazo ? situacaoPrazo(adm.proximo_prazo, aux.hoje) : ''
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
    return String(b.data).localeCompare(String(a.data)) || String(b.criado_em).localeCompare(String(a.criado_em));
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
    var atual = dados.id ? buscarPorId('ADMISSOES', dados.id) : null;
    if (dados.id && !atual) throw new Error('Admissão não encontrada.');

    var erros = validarAdmissao(adm, hoje());
    if (adm.paciente_id && !buscarPorId('PACIENTES', adm.paciente_id)) erros.unshift('Paciente não encontrado.');
    if (adm.unidade_id && !buscarPorId('UNIDADES', adm.unidade_id)) erros.push('Unidade não encontrada.');
    if (adm.desfecho_id && !buscarPorId('DESFECHOS', adm.desfecho_id)) erros.push('Desfecho não encontrado.');
    var primeiroAtend = atual ? atual.primeiro_atendimento : '';
    if (primeiroAtend && adm.data_admissao > primeiroAtend) erros.push('A admissão não pode ser depois do 1º atendimento.');
    var ultimoAtend = listar('ATENDIMENTOS').filter(function (a) { return atual && a.admissao_id === atual.id; })
      .reduce(function (m, a) { return a.data > m ? a.data : m; }, '');
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
    return detalheAdmissao(recalcularAdmissao(salvo.id));
  });
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
