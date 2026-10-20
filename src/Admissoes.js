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
      if (a.prazo_limite !== novo.prazo_limite || a.no_prazo !== novo.no_prazo || a.conta_prazo !== novo.conta_prazo) {
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
      admissao_id: adm.id, data: data, tipo: dados.tipo, quantidade: quantidade,
      profissional_id: prof.id, categoria: prof.categoria
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
