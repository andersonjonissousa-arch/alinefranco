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
