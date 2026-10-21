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
