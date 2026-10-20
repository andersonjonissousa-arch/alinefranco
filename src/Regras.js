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

/** Campos que o sistema calcula ao salvar um caso. */
function calcularCampos(caso) {
  var encerrado = Boolean(caso.desfecho) && Boolean(normalizarData(caso.data_encerramento));
  return {
    status: encerrado ? 'ENCERRADO' : 'ABERTO',
    dias_ate_solicitacao: diasEntre(caso.data_admissao, caso.data_solicitacao),
    dias_resposta: diasEntre(caso.data_solicitacao, caso.data_avaliacao),
    dias_acompanhamento: diasEntre(caso.data_avaliacao, caso.data_encerramento)
  };
}

/** Lista de erros de preenchimento do caso. Vazia quando está tudo certo. */
function validarCaso(caso) {
  var erros = [];
  if (!caso.paciente_id) erros.push('Informe o paciente.');
  if (!caso.unidade_id) erros.push('Informe a unidade.');
  if (!normalizarData(caso.data_solicitacao)) erros.push('Informe a data da solicitação.');

  var ordem = [
    ['data_admissao', 'data_solicitacao', 'A data da solicitação não pode ser antes da admissão.'],
    ['data_solicitacao', 'data_avaliacao', 'A data da avaliação não pode ser antes da solicitação.'],
    ['data_avaliacao', 'data_encerramento', 'A data de encerramento não pode ser antes da avaliação.']
  ];
  ordem.forEach(function (regra) {
    var dias = diasEntre(caso[regra[0]], caso[regra[1]]);
    if (dias !== '' && dias < 0) erros.push(regra[2]);
  });

  var temData = Boolean(normalizarData(caso.data_encerramento));
  if (caso.desfecho && !temData) erros.push('Informe a data de encerramento do desfecho.');
  if (temData && !caso.desfecho) erros.push('Informe o desfecho.');
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

/**
 * Prazos do acompanhamento de um caso.
 * Depois de cada contato (avaliação ou atendimento), o próximo tem que acontecer em até N dias úteis,
 * onde N é o prazo da justificativa vigente naquele contato.
 *
 * @param caso o caso (data_avaliacao, justificativa_id, necessidade_acompanhamento, status)
 * @param atendimentos atendimentos do caso (id, data, justificativa_id)
 * @param prazos { justificativa_id: prazo em dias úteis }
 * @param feriados conjunto de feriados (conjuntoFeriados)
 * @return { porAtendimento: { id: { prazo_limite, no_prazo } }, ultimo_contato, proximo_prazo }
 */
function calcularPrazos(caso, atendimentos, prazos, feriados) {
  var ordenados = atendimentos.filter(function (a) { return normalizarData(a.data); }).slice().sort(function (a, b) {
    var da = normalizarData(a.data);
    var db = normalizarData(b.data);
    if (da !== db) return da < db ? -1 : 1;
    var ca = String(a.criado_em || '');
    var cb = String(b.criado_em || '');
    return ca < cb ? -1 : ca > cb ? 1 : 0;
  });

  var porAtendimento = {};
  var anterior = normalizarData(caso.data_avaliacao) ? { data: normalizarData(caso.data_avaliacao), justificativa_id: '' } : null;
  var i = 0;
  while (i < ordenados.length) {
    var dia = normalizarData(ordenados[i].data);
    var doDia = [];
    while (i < ordenados.length && normalizarData(ordenados[i].data) === dia) doDia.push(ordenados[i++]);

    var temAnterior = anterior && anterior.data < dia;
    var justificativa = (temAnterior && anterior.justificativa_id) || doDia[0].justificativa_id || caso.justificativa_id;
    var prazo = prazoDaJustificativa(prazos, justificativa);
    var limite = temAnterior && prazo !== null ? adicionarDiasUteis(anterior.data, prazo, feriados) : '';
    doDia.forEach(function (a) {
      porAtendimento[a.id] = { prazo_limite: limite, no_prazo: limite ? (dia <= limite ? 'SIM' : 'NÃO') : '' };
    });
    anterior = { data: dia, justificativa_id: doDia[doDia.length - 1].justificativa_id || caso.justificativa_id };
  }

  var ultimo = anterior ? anterior.data : '';
  var acompanha = SEM_ACOMPANHAMENTO.indexOf(caso.necessidade_acompanhamento) === -1 && caso.necessidade_acompanhamento;
  var prazoAtual = prazoDaJustificativa(prazos, caso.justificativa_id);
  var proximo = ultimo && acompanha && caso.status !== 'ENCERRADO' && prazoAtual !== null
    ? adicionarDiasUteis(ultimo, prazoAtual, feriados)
    : '';
  return { porAtendimento: porAtendimento, ultimo_contato: ultimo, proximo_prazo: proximo };
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
