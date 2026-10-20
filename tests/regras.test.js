// Testes das regras puras. Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Carrega os arquivos do Apps Script num contexto isolado, como o Apps Script faz (escopo global único).
const contexto = vm.createContext({});
for (const arquivo of ['Config.js', 'Regras.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', arquivo), 'utf8'), contexto, { filename: arquivo });
}
const r = contexto;

test('normalizarData aceita ISO, DD/MM/AAAA e Date', () => {
  assert.equal(r.normalizarData('2026-10-05'), '2026-10-05');
  assert.equal(r.normalizarData('2026-10-05 00:00:00'), '2026-10-05');
  assert.equal(r.normalizarData('5/10/2026'), '2026-10-05');
  assert.equal(r.normalizarData(new Date(2026, 9, 5)), '2026-10-05');
  assert.equal(r.normalizarData(''), '');
  assert.equal(r.normalizarData('31/02/2026'), '');
  assert.equal(r.normalizarData('texto'), '');
});

test('diasEntre funciona como DAYS(fim; início) da planilha', () => {
  assert.equal(r.diasEntre('2025-06-24', '2025-06-24'), 0);
  assert.equal(r.diasEntre('2026-04-14', '2026-04-28'), 14);
  assert.equal(r.diasEntre('2026-02-27', '2026-03-02'), 3);
  assert.equal(r.diasEntre('2026-10-10', '2026-10-05'), -5);
  assert.equal(r.diasEntre('', '2026-10-05'), '');
});

test('inicioSemana devolve a segunda-feira', () => {
  assert.equal(r.inicioSemana('2026-10-01'), '2026-09-28'); // quinta
  assert.equal(r.inicioSemana('2026-10-05'), '2026-10-05'); // segunda
  assert.equal(r.inicioSemana('2026-10-11'), '2026-10-05'); // domingo
});

test('mesReferencia', () => {
  assert.equal(r.mesReferencia('2026-10-20'), '2026-10');
  assert.equal(r.mesReferencia(''), '');
});

test('normalizarProntuario remove o ".0" que vem da planilha', () => {
  assert.equal(r.normalizarProntuario(152429.0), '152429');
  assert.equal(r.normalizarProntuario('152429.0'), '152429');
  assert.equal(r.normalizarProntuario(' 15.242-9 '), '152429');
  assert.equal(r.normalizarProntuario(null), '');
});

test('normalizarTexto e formatarNome', () => {
  assert.equal(r.normalizarTexto('  José   Pedro '), 'JOSE PEDRO');
  assert.equal(r.formatarNome('  josé   pedro '), 'JOSÉ PEDRO');
});

test('calcularCampos: tempos e status', () => {
  const aberto = r.calcularCampos({
    data_admissao: '2026-04-14', data_solicitacao: '2026-04-20', data_avaliacao: '2026-04-28'
  });
  assert.equal(aberto.status, 'ABERTO');
  assert.equal(aberto.dias_ate_solicitacao, 6);
  assert.equal(aberto.dias_resposta, 8);
  assert.equal(aberto.dias_acompanhamento, '');

  const encerrado = r.calcularCampos({
    data_solicitacao: '2026-04-20', data_avaliacao: '2026-04-28', data_encerramento: '2026-05-10', desfecho: 'ALTA'
  });
  assert.equal(encerrado.status, 'ENCERRADO');
  assert.equal(encerrado.dias_acompanhamento, 12);
});

test('validarCaso aponta campos obrigatórios e datas fora de ordem', () => {
  assert.deepEqual(Array.from(r.validarCaso({ paciente_id: 'p', unidade_id: 'u', data_solicitacao: '2026-10-01' })), []);

  const erros = Array.from(r.validarCaso({
    data_solicitacao: '2026-10-05', data_avaliacao: '2026-10-01', desfecho: 'ALTA'
  }));
  assert.ok(erros.includes('Informe o paciente.'));
  assert.ok(erros.includes('Informe a unidade.'));
  assert.ok(erros.includes('A data da avaliação não pode ser antes da solicitação.'));
  assert.ok(erros.includes('Informe a data de encerramento do desfecho.'));
});

test('filtrarPacientes por prontuário ou nome sem acento', () => {
  const lista = [
    { id: '1', prontuario: '152429', nome: 'JOSÉ PEDRO DE SOUZA SANTOS' },
    { id: '2', prontuario: '131613', nome: 'MELINA ELEN TEIXEIRA DO VALE' }
  ];
  assert.equal(r.filtrarPacientes(lista, '152429').length, 1);
  assert.equal(r.filtrarPacientes(lista, '1524').length, 0);
  assert.equal(r.filtrarPacientes(lista, 'jose pedro')[0].id, '1');
  assert.equal(r.filtrarPacientes(lista, 'teixeira')[0].id, '2');
  assert.equal(r.filtrarPacientes(lista, '').length, 0);
});

test('acharDuplicado ignora o próprio registro', () => {
  const lista = [{ id: '1', prontuario: '152429', nome: 'A' }];
  assert.equal(r.acharDuplicado(lista, { prontuario: '152429.0' }).id, '1');
  assert.equal(r.acharDuplicado(lista, { id: '1', prontuario: '152429' }), null);
  assert.equal(r.acharDuplicado(lista, { prontuario: '' }), null);
});

test('setores iniciais cobrem todas as unidades da planilha', () => {
  const unidades = r.SETORES_INICIAIS.flatMap((s) => s.unidades);
  for (const u of ['PED 1', 'PED 2', 'UCE PED', 'UTI PED', 'UTIN', 'UCINCO', 'UTI 1', 'UTI 2', 'UTI 3',
    'UCE', 'AVC', 'CM 1', 'CM 2', 'CM 3', 'CM 4', 'CM 5', 'CM 6', 'CIRÚRGICA']) {
    assert.ok(unidades.includes(u), u);
  }
  assert.equal(new Set(unidades).size, unidades.length);
});

test('adicionarDiasUteis pula fim de semana e feriado', () => {
  const feriados = r.conjuntoFeriados([{ data: '2026-10-12' }]); // segunda, feriado
  assert.equal(r.adicionarDiasUteis('2026-10-08', 1), '2026-10-09'); // qui -> sex
  assert.equal(r.adicionarDiasUteis('2026-10-09', 1), '2026-10-12'); // sex -> seg
  assert.equal(r.adicionarDiasUteis('2026-10-09', 1, feriados), '2026-10-13'); // feriado pulado
  assert.equal(r.adicionarDiasUteis('2026-10-09', 3, feriados), '2026-10-15');
  assert.equal(r.adicionarDiasUteis('2026-10-09', 0), '2026-10-09');
  assert.equal(r.adicionarDiasUteis('', 2), '');
});

test('calcularPrazos: cada atendimento é medido a partir do contato anterior', () => {
  const prazos = { j1: 1, j3: 3 };
  const caso = { data_avaliacao: '2026-10-05', justificativa_id: 'j3', necessidade_acompanhamento: 'PACIENTE', status: 'ABERTO' };
  const atendimentos = [
    { id: 'a1', data: '2026-10-08', justificativa_id: 'j3' }, // 3 dias úteis depois da avaliação: no prazo
    { id: 'a2', data: '2026-10-08', justificativa_id: 'j3' }, // mesmo dia (família): mesmo resultado
    { id: 'a3', data: '2026-10-14', justificativa_id: 'j1' }  // limite era 13/10 (3 úteis após 08/10): fora
  ];
  const r1 = r.calcularPrazos(caso, atendimentos, prazos, {});
  assert.deepEqual({ ...r1.porAtendimento.a1 }, { prazo_limite: '2026-10-08', no_prazo: 'SIM' });
  assert.deepEqual({ ...r1.porAtendimento.a2 }, { prazo_limite: '2026-10-08', no_prazo: 'SIM' });
  assert.deepEqual({ ...r1.porAtendimento.a3 }, { prazo_limite: '2026-10-13', no_prazo: 'NÃO' });
  assert.equal(r1.ultimo_contato, '2026-10-14');
  assert.equal(r1.proximo_prazo, '2026-10-19'); // caso segue com j3: 3 úteis após 14/10
});

test('calcularPrazos: sem prazo quando não há acompanhamento, caso encerrado ou justificativa sem prazo', () => {
  const prazos = { j1: 1, jx: '' };
  const base = { data_avaliacao: '2026-10-05', justificativa_id: 'j1', necessidade_acompanhamento: 'PACIENTE', status: 'ABERTO' };
  assert.equal(r.calcularPrazos(base, [], prazos, {}).proximo_prazo, '2026-10-06');
  assert.equal(r.calcularPrazos({ ...base, necessidade_acompanhamento: 'NÃO' }, [], prazos, {}).proximo_prazo, '');
  assert.equal(r.calcularPrazos({ ...base, status: 'ENCERRADO' }, [], prazos, {}).proximo_prazo, '');
  assert.equal(r.calcularPrazos({ ...base, justificativa_id: 'jx' }, [], prazos, {}).proximo_prazo, '');
  const semAvaliacao = r.calcularPrazos({ ...base, data_avaliacao: '' }, [{ id: 'a', data: '2026-10-07' }], prazos, {});
  assert.deepEqual({ ...semAvaliacao.porAtendimento.a }, { prazo_limite: '', no_prazo: '' });
});

test('situacaoPrazo e contaParaEmpresa', () => {
  assert.equal(r.situacaoPrazo('2026-10-19', '2026-10-20'), 'ATRASADO');
  assert.equal(r.situacaoPrazo('2026-10-20', '2026-10-20'), 'VENCE HOJE');
  assert.equal(r.situacaoPrazo('2026-10-21', '2026-10-20'), 'NO PRAZO');
  assert.equal(r.situacaoPrazo('', '2026-10-20'), '');
  assert.equal(r.contaParaEmpresa('PROFISSIONAL DA EMPRESA'), true);
  assert.equal(r.contaParaEmpresa('RESIDENTE'), false);
});
