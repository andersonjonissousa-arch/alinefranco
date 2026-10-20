// Testes das regras puras. Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Carrega os arquivos do Apps Script num contexto isolado, como o Apps Script faz (escopo global único).
const contexto = vm.createContext({});
for (const arquivo of ['Config.js', 'Regras.js', 'Indicadores.js']) {
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

test('setores iniciais cobrem todas as unidades', () => {
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

test('situacaoPrazo e contaParaEmpresa', () => {
  assert.equal(r.situacaoPrazo('2026-10-19', '2026-10-20'), 'ATRASADO');
  assert.equal(r.situacaoPrazo('2026-10-20', '2026-10-20'), 'VENCE HOJE');
  assert.equal(r.situacaoPrazo('2026-10-21', '2026-10-20'), 'NO PRAZO');
  assert.equal(r.situacaoPrazo('', '2026-10-20'), '');
  assert.equal(r.contaParaEmpresa('PROFISSIONAL DA EMPRESA'), true);
  assert.equal(r.contaParaEmpresa('RESIDENTE'), false);
});

test('validarAdmissao: obrigatórios, datas e desfecho', () => {
  const ok = { paciente_id: 'p', unidade_id: 'u', data_admissao: '2026-10-10' };
  assert.deepEqual(Array.from(r.validarAdmissao(ok, '2026-10-20')), []);
  const erros = Array.from(r.validarAdmissao({
    data_admissao: '2026-10-10', data_solicitacao: '2026-10-05', data_desfecho: '2026-10-25',
    necessidade_acompanhamento: 'PACIENTE'
  }, '2026-10-20'));
  assert.ok(erros.includes('Informe o paciente.'));
  assert.ok(erros.includes('Informe a unidade.'));
  assert.ok(erros.includes('A data de solicitação não pode ser antes da admissão.'));
  assert.ok(erros.includes('A data de desfecho está no futuro.'));
  assert.ok(erros.includes('Informe o desfecho.'));
  assert.ok(erros.includes('Informe a justificativa do acompanhamento.'));
});

test('contaParaPrazo: família só conta com o paciente impossibilitado', () => {
  assert.equal(r.contaParaPrazo({ publico: 'PACIENTE' }), true);
  assert.equal(r.contaParaPrazo({ publico: 'FAMÍLIA', paciente_impossibilitado: 'NÃO' }), false);
  assert.equal(r.contaParaPrazo({ publico: 'FAMÍLIA', paciente_impossibilitado: 'SIM' }), true);
});

const OP = { prazos: { j2: 2, j1: 1 }, feriados: {}, diasPrimeiro: 3, desfechoEncerra: false, hoje: '2026-10-20' };
// Admissão numa sexta (09/10/2026): 3 dias úteis = quarta 14/10.
const ADM = { data_admissao: '2026-10-09', data_solicitacao: '2026-10-12', justificativa_id: 'j2', necessidade_acompanhamento: 'PACIENTE' };

test('calcularAdmissao: aguardando o 1º atendimento', () => {
  const dentro = r.calcularAdmissao(ADM, [], { ...OP, hoje: '2026-10-13' }).campos;
  assert.equal(dentro.status, 'AGUARDANDO 1º ATENDIMENTO');
  assert.equal(dentro.prazo_primeiro_atendimento, '2026-10-14');
  assert.equal(dentro.primeiro_no_prazo, 'EM ANDAMENTO');
  assert.equal(dentro.proximo_prazo, '2026-10-14');
  const passou = r.calcularAdmissao(ADM, [], OP).campos;
  assert.equal(passou.primeiro_no_prazo, 'NÃO');
});

test('calcularAdmissao: 1º atendimento e retornos, família sem impossibilidade não conta', () => {
  const atend = [
    { id: 'f1', data: '2026-10-13', publico: 'FAMÍLIA', paciente_impossibilitado: 'NÃO', justificativa_id: 'j2' },
    { id: 'p1', data: '2026-10-14', publico: 'PACIENTE', justificativa_id: 'j2' },
    { id: 'f2', data: '2026-10-16', publico: 'FAMÍLIA', paciente_impossibilitado: 'SIM', justificativa_id: 'j2' },
    { id: 'p2', data: '2026-10-21', publico: 'PACIENTE', justificativa_id: 'j2' }
  ];
  const res = r.calcularAdmissao(ADM, atend, { ...OP, hoje: '2026-10-21' });
  assert.deepEqual({ ...res.porAtendimento.f1 }, { prazo_limite: '', no_prazo: '', conta_prazo: 'NÃO', tipo_prazo: '' });
  assert.deepEqual({ ...res.porAtendimento.p1 }, { prazo_limite: '2026-10-14', no_prazo: 'SIM', conta_prazo: 'SIM', tipo_prazo: 'PRIMEIRO' });
  assert.deepEqual({ ...res.porAtendimento.f2 }, { prazo_limite: '2026-10-16', no_prazo: 'SIM', conta_prazo: 'SIM', tipo_prazo: 'RETORNO' });
  assert.deepEqual({ ...res.porAtendimento.p2 }, { prazo_limite: '2026-10-20', no_prazo: 'NÃO', conta_prazo: 'SIM', tipo_prazo: 'RETORNO' });
  const c = res.campos;
  assert.equal(c.status, 'EM ACOMPANHAMENTO');
  assert.equal(c.primeiro_atendimento, '2026-10-14');
  assert.equal(c.primeiro_no_prazo, 'SIM');
  assert.equal(c.dias_ate_primeiro_atendimento, 5);
  assert.equal(c.dias_resposta, 2);
  assert.equal(c.ultimo_contato, '2026-10-21');
  assert.equal(c.proximo_prazo, '2026-10-23');
});

test('calcularAdmissao: só familiar sem impossibilidade não vale como 1º atendimento', () => {
  const atend = [{ id: 'f', data: '2026-10-12', publico: 'FAMÍLIA', paciente_impossibilitado: 'NÃO' }];
  const c = r.calcularAdmissao(ADM, atend, OP).campos;
  assert.equal(c.status, 'AGUARDANDO 1º ATENDIMENTO');
  assert.equal(c.primeiro_no_prazo, 'NÃO');
  const comImpossibilidade = r.calcularAdmissao(ADM, [{ ...atend[0], paciente_impossibilitado: 'SIM' }], OP).campos;
  assert.equal(comImpossibilidade.primeiro_no_prazo, 'SIM');
});

test('calcularAdmissao: desfecho dentro do prazo sem atendimento fica fora do indicador', () => {
  const saiu = { ...ADM, desfecho_id: 'd', data_desfecho: '2026-10-13' };
  const c = r.calcularAdmissao(saiu, [], { ...OP, desfechoEncerra: true }).campos;
  assert.equal(c.status, 'ENCERRADA');
  assert.equal(c.primeiro_no_prazo, 'NÃO SE APLICA');
  assert.equal(c.proximo_prazo, '');
  const depois = r.calcularAdmissao({ ...saiu, data_desfecho: '2026-10-16' }, [], { ...OP, desfechoEncerra: true }).campos;
  assert.equal(depois.primeiro_no_prazo, 'NÃO');
});

test('calcularAdmissao: desfecho psicológico para os prazos; retomada recomeça a contagem', () => {
  const atend = [{ id: 'p1', data: '2026-10-13', publico: 'PACIENTE', justificativa_id: 'j2' }];
  const encerrado = r.calcularAdmissao({ ...ADM, desfecho_id: 'ap', data_desfecho: '2026-10-14' }, atend, OP).campos;
  assert.equal(encerrado.status, 'ACOMPANHAMENTO ENCERRADO');
  assert.equal(encerrado.proximo_prazo, '');

  const retomada = { ...ADM, retomado_em: '2026-10-26', justificativa_id: 'j1' };
  const atend2 = atend.concat([{ id: 'p2', data: '2026-10-27', publico: 'PACIENTE', justificativa_id: 'j1' }]);
  const res = r.calcularAdmissao(retomada, atend2, { ...OP, hoje: '2026-10-27' });
  assert.equal(res.porAtendimento.p2.prazo_limite, '2026-10-27'); // 1 dia útil após a retomada
  assert.equal(res.porAtendimento.p2.no_prazo, 'SIM');
  assert.equal(res.campos.status, 'EM ACOMPANHAMENTO');
  assert.equal(res.campos.proximo_prazo, '2026-10-28');
  const semAtendimentoAinda = r.calcularAdmissao(retomada, atend, { ...OP, hoje: '2026-10-26' }).campos;
  assert.equal(semAtendimentoAinda.ultimo_contato, '2026-10-26');
  assert.equal(semAtendimentoAinda.proximo_prazo, '2026-10-27');
});

test('montarCompilado: mensal por unidade, grupos e indicadores', () => {
  const unidades = [
    { id: 'u1', nome: 'PED 1', setor_id: 's1', ativo: 'SIM' },
    { id: 'u2', nome: 'UTI 1', setor_id: 's2', ativo: 'SIM' },
    { id: 'u3', nome: 'VELHA', setor_id: 's2', ativo: 'NÃO' }
  ];
  const E = 'PROFISSIONAL DA EMPRESA';
  const dados = {
    unidades,
    admissoes: [
      { id: 'a1', unidade_id: 'u1', data_admissao: '2026-10-05', tipo_solicitacao: 'EQUIPE', primeiro_no_prazo: 'SIM', dias_ate_primeiro_atendimento: '2', desfecho_id: 'd1', data_desfecho: '2026-10-20' },
      { id: 'a2', unidade_id: 'u1', data_admissao: '2026-10-07', tipo_solicitacao: 'BUSCA ATIVA', primeiro_no_prazo: 'NÃO', dias_ate_primeiro_atendimento: '6' },
      { id: 'a3', unidade_id: 'u2', data_admissao: '2026-10-08', primeiro_no_prazo: 'NÃO SE APLICA', dias_ate_primeiro_atendimento: '' },
      { id: 'a4', unidade_id: 'u2', data_admissao: '2026-09-30', primeiro_no_prazo: 'SIM' } // outro mês
    ],
    atendimentos: [
      { unidade_id: 'u1', data: '2026-10-06', publico: 'PACIENTE', categoria: E, tipo_prazo: 'PRIMEIRO', no_prazo: 'SIM' },
      { unidade_id: 'u1', data: '2026-10-08', publico: 'PACIENTE', categoria: E, tipo_prazo: 'RETORNO', no_prazo: 'SIM' },
      { unidade_id: 'u1', data: '2026-10-09', publico: 'FAMÍLIA', quantidade: '3', paciente_impossibilitado: 'SIM', categoria: 'RESIDENTE', tipo_prazo: 'RETORNO', no_prazo: 'NÃO' },
      { unidade_id: 'u2', data: '2026-10-09', publico: 'PACIENTE', categoria: 'ESTAGIÁRIO' },
      { unidade_id: 'u3', data: '2026-10-10', publico: 'PACIENTE', categoria: E },
      { unidade_id: 'u1', data: '2026-11-01', publico: 'PACIENTE', categoria: E }
    ],
    atividades: [{ unidade_id: 'u2', data: '2026-10-09', tipo: 'DISCUSSÃO DE CASO', quantidade: '2', categoria: E }],
    reunioes: [{ unidade_id: 'u1', data: '2026-10-09', tipo: 'GRUPO', quantidade: '1', categoria: E }],
    gerenciais: [{ data: '2026-10-09', tipo: 'TREINAMENTO', quantidade: '4', categoria: E }],
    listas: { TIPO_SOLICITACAO: ['EQUIPE', 'BUSCA ATIVA', 'ESPONTÂNEA'], ATIVIDADE_GERENCIAL: ['TREINAMENTO'] },
    desfechos: [{ id: 'd1', nome: 'ALTA' }, { id: 'd2', nome: 'ÓBITO' }]
  };
  const op = { ano: 2026, mes: 10, eixo: 'UNIDADE', grupo: 'TODOS', diasPrimeiro: 3 };
  const c = r.montarCompilado(dados, op);
  assert.equal(c.titulo, 'COMPILADO OUTUBRO DE 2026');
  assert.deepEqual(c.colunas.map((x) => x.nome), ['PED 1', 'UTI 1', 'VELHA']); // inativa com dado aparece
  const sec = (t) => c.secoes.find((s) => s.titulo.startsWith(t));
  const lin = (t, rot) => sec(t).linhas.find((l) => l.rotulo.startsWith(rot));

  assert.deepEqual(Array.from(lin('Atendimentos', 'PACIENTE').valores), [2, 1, 1]);
  assert.equal(lin('Atendimentos', 'FAMÍLIA').total, 3);
  assert.equal(lin('Atendimentos', 'TOTAL').total, 7);
  assert.equal(lin('Admissões', 'ADMISSÕES').total, 3);
  assert.deepEqual(Array.from(lin('Tipo de solicitação', 'EQUIPE').valores), [1, 0, 0]);
  assert.equal(lin('Tipo de solicitação', 'NÃO INFORMADO').total, 1);
  assert.equal(lin('1º atendimento', '% NO PRAZO').total, 0.5);
  assert.equal(lin('1º atendimento', 'NÃO SE APLICA').total, 1);
  assert.equal(lin('1º atendimento', 'MÉDIA').total, 4);
  assert.equal(lin('Retornos', '% NO PRAZO').valores[0], 0.5);
  assert.equal(lin('Retornos', '% NO PRAZO').valores[1], null);
  assert.equal(lin('Desfechos', 'ALTA').total, 1);
  assert.equal(lin('Atividades assistenciais', 'DISCUSSÃO DE CASO').total, 2);
  assert.equal(lin('Reuniões de equipe', 'GRUPO').total, 1);
  assert.equal(sec('Atividades gerenciais').semColunas, true);
  assert.equal(lin('Atividades gerenciais', 'TREINAMENTO').total, 4);

  const emp = r.montarCompilado(dados, { ...op, grupo: 'EMPRESA' });
  const linE = (t, rot) => emp.secoes.find((s) => s.titulo.startsWith(t)).linhas.find((l) => l.rotulo.startsWith(rot));
  assert.equal(linE('Atendimentos', 'PACIENTE').total, 3); // sem a estagiária
  assert.equal(linE('Atendimentos', 'FAMÍLIA').total, 0); // família foi da residente
  assert.equal(linE('Retornos', '% NO PRAZO').total, 1);
  assert.equal(linE('Admissões', 'ADMISSÕES').total, 3); // admissões são do serviço todo
  assert.ok(emp.secoes.find((s) => s.titulo === 'Admissões').nota);

  const setor = r.montarCompilado(dados, { ...op, setor_id: 's2' });
  assert.deepEqual(setor.colunas.map((x) => x.nome), ['UTI 1', 'VELHA']);
});

test('montarCompilado: anual por mês e exportação em tabela', () => {
  const dados = {
    unidades: [{ id: 'u1', nome: 'PED 1', setor_id: 's1' }, { id: 'u2', nome: 'UTI 1', setor_id: 's2' }],
    admissoes: [], atividades: [], reunioes: [],
    atendimentos: [
      { unidade_id: 'u1', data: '2026-01-10', publico: 'PACIENTE', categoria: 'RESIDENTE' },
      { unidade_id: 'u2', data: '2026-03-10', publico: 'PACIENTE', categoria: 'RESIDENTE' },
      { unidade_id: 'u1', data: '2025-03-10', publico: 'PACIENTE', categoria: 'RESIDENTE' }
    ],
    gerenciais: [{ data: '2026-03-02', tipo: 'TREINAMENTO', categoria: 'RESIDENTE' }],
    listas: {}, desfechos: []
  };
  const c = r.montarCompilado(dados, { ano: 2026, eixo: 'MES', grupo: 'RESIDENTE', diasPrimeiro: 3 });
  assert.equal(c.titulo, 'COMPILADO ANUAL 2026');
  assert.equal(c.colunas.length, 12);
  const pac = c.secoes[0].linhas[0];
  assert.equal(pac.valores[0], 1);
  assert.equal(pac.valores[2], 1);
  assert.equal(pac.total, 2);
  assert.equal(c.secoes.find((s) => s.titulo === 'Atividades gerenciais').linhas[0].valores[2], 1);
  const soPed = r.montarCompilado(dados, { ano: 2026, eixo: 'MES', grupo: 'TODOS', unidade_id: 'u1', diasPrimeiro: 3 });
  assert.equal(soPed.secoes[0].linhas[0].total, 1);

  const t = r.compiladoEmTabela(c);
  assert.equal(t.linhas[0][0], 'COMPILADO ANUAL 2026');
  assert.ok(t.linhas.every((l) => l.length === t.largura));
  const cab = t.linhas[t.tipos.indexOf('cabecalho')];
  assert.deepEqual(Array.from(cab.slice(0, 3)), ['ATENDIMENTOS', 'JAN', 'FEV']);
  assert.equal(cab[13], 'TOTAL');
  assert.equal(r.formatarValorCompilado(0.857, 'pct'), '86%');
  assert.equal(r.formatarValorCompilado(2.25, 'media'), '2,3');
  assert.equal(r.formatarValorCompilado(null, 'pct'), '—');
});
