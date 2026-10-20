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
