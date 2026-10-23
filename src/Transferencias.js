/** Localização atual e histórico de movimentações internas da mesma internação. */
function listarTransferencias_() {
  if (!_cacheTabelas.TRANSFERENCIAS && !abrirBanco().getSheetByName('TRANSFERENCIAS')) {
    comTrava(function () {
      if (!abrirBanco().getSheetByName('TRANSFERENCIAS')) prepararAba(abrirBanco(), 'TRANSFERENCIAS');
    });
  }
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
  return responder(function () {
    var usuario = usuarioAtual();
    dados = dados || {};
    listarTransferencias_();
    var admissaoId = comTrava(function () {
      // Releitura sob a trava: duas profissionais não criam uma origem desatualizada.
      delete _cacheTabelas.ADMISSOES;
      delete _cacheTabelas.TRANSFERENCIAS;
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
      abaDaTabela('TRANSFERENCIAS').appendRow(linhaDe(TABELAS.TRANSFERENCIAS, registro));
      delete _cacheTabelas.TRANSFERENCIAS;
      return adm.id;
    });
    return detalheAdmissao(buscarPorId('ADMISSOES', admissaoId));
  });
}
