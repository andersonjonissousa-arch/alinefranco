const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = vm.createContext({});
for (const f of ['Config.js', 'Regras.js', 'PainelIndicadores.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx);
}
const op = { ano: 2026, mes: 11, agora: '2026-11-20 12:00', diasPrimeiro: 3, inicioPrimeiro: '2026-11-03' };
function dados() {
  return { pacientes: [{ id: 'p', nome: 'MARIA', prontuario: '123' }],
    unidades: [{ id: 'u', nome: 'CM 1', setor_id: 's' }],
    admissoes: [{ id: 'a', paciente_id: 'p', unidade_id: 'u', data_admissao: '2026-11-03',
      necessidade_acompanhamento: 'PACIENTE', justificativa_id: 'baixa' }],
    atendimentos: [], interconsultas: [], desfechos: [],
    justificativas: [{ id: 'alta', nome: 'RISCO DE SUICÍDIO', prioridade_id: 'pa' },
      { id: 'baixa', nome: 'BONS RECURSOS', prioridade_id: 'pb' }, { id: 'sem', nome: 'SEM PRAZO' }],
    prioridades: [{ id: 'pa', nome: 'ALTA', prazo: 2 }, { id: 'pb', nome: 'BAIXA', prazo: 5 }],
    feriados: [{ data: '2026-11-05' }] };
}
function contato(id, data, justificativa_id, extra = {}) {
  return { id, data, hora: '10:00', admissao_id: 'a', unidade_id: 'u', publico: 'PACIENTE', justificativa_id, ...extra };
}
function painel(d, extra = {}) { return ctx.montarPainelIndicadores(d, { ...op, ...extra }); }

test('primeiro atendimento respeita início oficial, feriado, atraso aberto, andamento e não se aplica', () => {
  const d = dados();
  const base = d.admissoes[0];
  d.admissoes = [base, { ...base, id: 'antiga', data_admissao: '2026-11-01' },
    { ...base, id: 'atrasada' }, { ...base, id: 'aguardando', data_admissao: '2026-11-19' },
    { ...base, id: 'alta', desfecho_id: 'd', data_desfecho: '2026-11-04' }];
  d.atendimentos = [contato('at', '2026-11-09', 'baixa')];
  const p = painel(d).primeiro;
  assert.equal(p.casos.find(i => i.id === 'a').prazo, '2026-11-09');
  assert.equal(p.resumo.no_prazo, 1);
  assert.equal(p.resumo.fora_prazo, 1);
  assert.equal(p.resumo.em_andamento, 1);
  assert.equal(p.resumo.nao_se_aplica, 1);
  assert.equal(p.resumo.fora_escopo, 1);
  assert.equal(p.resumo.percentual, 0.5);
  assert.equal(p.resumo.atrasados_abertos, 1);
});

test('interconsultas contam solicitações individualmente, excluem apagadas e não confundem sem prazo com atraso', () => {
  const d = dados();
  const base = { admissao_id: 'a', unidade_id: 'u', data_solicitacao: '2026-11-10', hora_solicitacao: '10:00', prioridade_solicitacao: 'ALTA', prazo_resposta: '2026-11-11 10:00' };
  d.interconsultas = [
    { ...base, id: '1', resposta_no_prazo: 'SIM', momento_resposta: '2026-11-10 11:00' },
    { ...base, id: '2', resposta_no_prazo: 'NÃO', pendente: true },
    { ...base, id: '3', resposta_no_prazo: 'SEM PRAZO', prazo_resposta: '', pendente: true },
    { ...base, id: '4', resposta_no_prazo: 'EM ANDAMENTO', pendente: true },
    { ...base, id: '5', resposta_no_prazo: 'SIM', excluido_em: '2026-11-20' }
  ];
  const p = painel(d).interconsultas;
  assert.equal(p.resumo.total, 4);
  assert.equal(p.resumo.percentual, 0.5);
  assert.equal(p.resumo.sem_prazo, 1);
  assert.equal(p.resumo.atrasados_abertos, 1);
  assert.equal(p.grupos[0].resumo.avaliados, 2);
});

test('retornos usam justificativa do contato anterior, contam um intervalo por dia e incluem pendência vencida', () => {
  const d = dados();
  d.atendimentos = [contato('1', '2026-11-03', 'alta'), contato('2', '2026-11-06', 'baixa'),
    contato('3', '2026-11-06', 'baixa', { hora: '11:00' })];
  const p = painel(d).acompanhamento;
  assert.equal(p.resumo.total, 2);
  const primeiro = p.casos.find(i => i.id === '1');
  assert.equal(primeiro.prazo, '2026-11-06'); // o feriado de 05/11 não conta
  assert.equal(primeiro.grupo, 'RISCO DE SUICÍDIO');
  assert.equal(primeiro.resultado, 'SIM');
  assert.equal(p.casos.find(i => i.id === '3').grupo, 'BONS RECURSOS');
  assert.equal(p.resumo.fora_prazo, 1);
  assert.equal(p.resumo.atrasados_abertos, 1);
  assert.equal(p.resumo.percentual, 0.5);
});

test('família sem impossibilidade não responde retorno; mês do vencimento pode diferir do mês do atendimento', () => {
  const d = dados();
  d.atendimentos = [contato('outubro', '2026-10-30', 'alta'),
    contato('familia', '2026-11-03', 'alta', { publico: 'FAMÍLIA', paciente_impossibilitado: 'NÃO' })];
  const p = painel(d).acompanhamento;
  assert.equal(p.resumo.total, 1);
  assert.equal(p.casos[0].inicio, '2026-10-30');
  assert.equal(p.casos[0].realizado, '');
  assert.equal(p.resumo.fora_prazo, 1);
});

test('desfecho pausa retorno e retomada inicia ciclo sem contar atendimento após alta como resposta anterior', () => {
  const d = dados();
  d.admissoes[0].retomado_em = '2026-11-10';
  d.atendimentos = [contato('antes', '2026-11-03', 'alta'), contato('depois', '2026-11-11', 'baixa')];
  d.desfechos = [{ admissao_id: 'a', data: '2026-11-04', vigente: 'NÃO' }];
  const p = painel(d).acompanhamento;
  assert.equal(p.casos.find(i => i.id === 'antes').resultado, 'NÃO SE APLICA');
  assert.equal(p.casos.find(i => i.id === 'retomada_a').realizado, '2026-11-11');
  assert.equal(p.casos.find(i => i.id === 'retomada_a').resultado, 'SIM');
});

test('dados ausentes e sem prazo não geram zero por cento; filtros e mês sem dados não mudam os registros', () => {
  const d = dados();
  d.atendimentos = [contato('1', '2026-11-03', ''), contato('2', '2026-11-06', 'sem')];
  d.admissoes[0].justificativa_id = 'sem';
  const antes = JSON.stringify(d);
  const p = painel(d).acompanhamento;
  assert.equal(p.resumo.dados_pendentes, 1);
  assert.equal(p.resumo.sem_prazo, 1);
  assert.equal(p.resumo.percentual, null);
  assert.equal(painel(d, { setor_id: 'outro' }).acompanhamento.resumo.total, 0);
  assert.equal(painel(d, { unidade_id: 'outra' }).primeiro.resumo.total, 0);
  assert.equal(painel(d, { termo: 'inexistente' }).primeiro.resumo.total, 0);
  assert.equal(painel(d, { termo: 'maria' }).primeiro.resumo.total, 1);
  assert.equal(painel(d, { mes: 12 }).primeiro.resumo.percentual, null);
  assert.equal(JSON.stringify(d), antes);
});

test('alta e retomada no mesmo dia não cancelam a obrigação do novo ciclo', () => {
  const d = dados();
  d.admissoes[0].retomado_em = '2026-11-10';
  d.atendimentos = [contato('novo', '2026-11-10', 'baixa')];
  d.desfechos = [{ admissao_id: 'a', data: '2026-11-10', vigente: 'NÃO' }];
  const p = painel(d).acompanhamento;
  assert.equal(p.resumo.fora_prazo, 1);
  assert.equal(p.resumo.nao_se_aplica, 0);
});
