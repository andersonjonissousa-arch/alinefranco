// Exercita a tela real com respostas assíncronas controladas, sem serviços Google.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Elemento {
  constructor(tag, texto = '') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.listeners = {};
    this.value = '';
    this.disabled = false;
    this._texto = texto;
  }
  set textContent(texto) {
    this.children = [];
    this._texto = String(texto);
  }
  get textContent() {
    return this._texto + this.children.map((filho) => filho.textContent).join('');
  }
  appendChild(filho) {
    this.children.push(filho);
    return filho;
  }
  setAttribute(nome, valor) {
    if (nome === 'disabled') this.disabled = true;
    else this[nome === 'class' ? 'className' : nome] = String(valor);
  }
  addEventListener(tipo, fn) {
    (this.listeners[tipo] ||= []).push(fn);
  }
  emitir(tipo) {
    for (const fn of this.listeners[tipo] || []) fn({ preventDefault() {} });
  }
  focus() {}
  get elements() {
    return descendentes(this).filter((el) => ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(el.tagName));
  }
}

function descendentes(elemento) {
  return elemento.children.flatMap((filho) => [filho, ...descendentes(filho)]);
}

async function concluirPromessas() {
  // A tela encadeia salvar -> enviar/finally -> atualizar a listagem.
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

function carregarTela() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'App.html'), 'utf8');
  const conteudo = new Elemento('main');
  const pedidos = [];
  const avisos = [];
  const timers = new Map();
  let proximoTimer = 0;
  const ctx = vm.createContext({
    estado: { cad: { hoje: '2026-10-21', sexos_paciente: ['FEMININO', 'MASCULINO', 'INTERSEXO'] } },
    document: {
      createElement: (tag) => new Elemento(tag),
      createTextNode: (texto) => new Elemento('#text', texto),
      getElementById: () => conteudo
    },
    chamar: (nome, ...args) => new Promise((resolve, reject) => {
      pedidos.push({ nome, args: JSON.parse(JSON.stringify(args)), resolve, reject });
    }),
    avisar: (mensagem, tipo) => avisos.push({ mensagem, tipo }),
    setTimeout: (fn) => { timers.set(++proximoTimer, fn); return proximoTimer; },
    clearTimeout: (id) => timers.delete(id)
  });
  for (const [inicio, fim] of [
    ['  function h(', '  function avisar('],
    ['  function campo(', '  function lerFormulario('],
    ['  function lerFormulario(', '  /** Desabilita o botão'],
    ['  function enviar(', '  function tela('],
    ['  function tela(', '  function ehCoordenacao('],
    ['  function camposDemograficosPaciente(', '  // ---------- Admissões ----------']
  ]) {
    const de = html.indexOf(inicio);
    const ate = html.indexOf(fim, de);
    assert.ok(de !== -1 && ate > de, 'Trecho da tela encontrado: ' + inicio);
    vm.runInContext(html.slice(de, ate), ctx);
  }
  ctx.telaPacientes();
  const todos = () => descendentes(conteudo);
  const busca = todos().find((el) => el.type === 'search');
  return {
    conteudo, pedidos, avisos, busca, todos,
    resultado: () => todos().find((el) => el.className === 'tabela-rolagem'),
    async responder(indice, dados) {
      assert.ok(pedidos[indice], 'A tela fez a consulta esperada antes de receber a resposta');
      pedidos[indice].resolve(dados);
      await concluirPromessas();
    },
    async falhar(indice, mensagem) {
      assert.ok(pedidos[indice], 'A tela fez a consulta esperada antes de receber o erro');
      pedidos[indice].reject(new Error(mensagem));
      await concluirPromessas();
    },
    digitar(termo) { busca.value = termo; busca.emitir('input'); },
    dispararBusca() {
      const pendentes = [...timers.values()];
      timers.clear();
      for (const fn of pendentes) fn();
    }
  };
}

function pagina(pacientes, extras = {}) {
  return { pacientes, pagina: 1, paginas: 1, total: pacientes.length, tamanho_pagina: 20, ...extras };
}

const paciente = { id: 'p1', prontuario: '7', nome: 'MARIA DE SOUZA' };

test('pacientes: abrir a tela carrega e mostra os cadastros sem digitar', async () => {
  const tela = carregarTela();
  assert.equal(tela.pedidos.length, 1);
  assert.equal(tela.pedidos[0].nome, 'apiListarPacientes');
  assert.deepEqual(tela.pedidos[0].args, [{ termo: '', pagina: 1 }]);
  assert.match(tela.resultado().textContent, /carregando/i);
  await tela.responder(0, pagina([paciente]));
  assert.match(tela.resultado().textContent, /MARIA DE SOUZA/);
  assert.ok(tela.todos().some((el) => el.tagName === 'TD' && el.textContent === '7'));
});

test('pacientes: salvar prontuário de um dígito atualiza a lista com o paciente salvo', async () => {
  const tela = carregarTela();
  await tela.responder(0, pagina([]));
  tela.digitar('filtro anterior ainda no debounce');
  const form = tela.todos().find((el) => el.tagName === 'FORM');
  form.elements.find((el) => el.name === 'prontuario').value = '7';
  form.elements.find((el) => el.name === 'nome').value = 'Maria de Souza';
  form.emitir('submit');
  assert.equal(tela.pedidos[1].nome, 'apiSalvarPaciente');
  assert.equal(tela.pedidos[1].args[0].prontuario, '7');
  await tela.responder(1, paciente);
  assert.equal(tela.busca.value, '7');
  assert.equal(tela.pedidos[2].nome, 'apiListarPacientes');
  assert.deepEqual(tela.pedidos[2].args, [{ termo: '7', pagina: 1 }]);
  tela.dispararBusca();
  assert.equal(tela.pedidos.length, 3, 'O cadastro cancela a busca pendente do filtro anterior');
  await tela.responder(2, pagina([paciente]));
  assert.match(tela.resultado().textContent, /MARIA DE SOUZA/);
});

test('pacientes: limpar o filtro volta a consultar a lista geral', async () => {
  const tela = carregarTela();
  await tela.responder(0, pagina([paciente]));
  tela.digitar('inexistente');
  tela.dispararBusca();
  await tela.responder(1, pagina([]));
  assert.match(tela.resultado().textContent, /nenhum paciente/i);
  tela.digitar('');
  tela.dispararBusca();
  assert.deepEqual(tela.pedidos[2].args, [{ termo: '', pagina: 1 }]);
  await tela.responder(2, pagina([paciente]));
  assert.match(tela.resultado().textContent, /MARIA DE SOUZA/);
});

test('pacientes: respostas antigas não substituem o filtro mais recente', async () => {
  const tela = carregarTela();
  tela.digitar('maria');
  // A resposta anterior também deve ser ignorada durante o debounce.
  await tela.responder(0, pagina([{ ...paciente, nome: 'RESULTADO ANTIGO' }]));
  assert.doesNotMatch(tela.resultado().textContent, /RESULTADO ANTIGO/);
  tela.dispararBusca();
  tela.digitar('joana');
  tela.dispararBusca();
  await tela.responder(2, pagina([{ ...paciente, nome: 'JOANA ATUAL' }]));
  await tela.responder(1, pagina([{ ...paciente, nome: 'MARIA OBSOLETA' }]));
  assert.match(tela.resultado().textContent, /JOANA ATUAL/);
  assert.doesNotMatch(tela.resultado().textContent, /MARIA OBSOLETA/);
});

test('pacientes: navegação consulta as páginas seguintes e anteriores', async () => {
  const tela = carregarTela();
  await tela.responder(0, pagina([paciente], { paginas: 2, total: 21 }));
  let anterior = tela.todos().find((el) => el.tagName === 'BUTTON' && /anterior/i.test(el.textContent));
  const proxima = tela.todos().find((el) => el.tagName === 'BUTTON' && /próxim[ao]/i.test(el.textContent));
  assert.ok(anterior && proxima, 'A lista oferece navegação de páginas');
  assert.equal(anterior.disabled, true);
  proxima.emitir('click');
  assert.deepEqual(tela.pedidos[1].args, [{ termo: '', pagina: 2 }]);
  await tela.responder(1, pagina([{ ...paciente, nome: 'PACIENTE DA SEGUNDA PÁGINA' }], { pagina: 2, paginas: 2, total: 21 }));
  assert.match(tela.resultado().textContent, /PACIENTE DA SEGUNDA PÁGINA/);
  assert.equal(tela.todos().find((el) => el.tagName === 'BUTTON' && /próxim[ao]/i.test(el.textContent)).disabled, true);
  anterior = tela.todos().find((el) => el.tagName === 'BUTTON' && /anterior/i.test(el.textContent));
  anterior.emitir('click');
  assert.deepEqual(tela.pedidos[2].args, [{ termo: '', pagina: 1 }]);
});

test('pacientes: falha da consulta fica visível e uma busca posterior recupera a tela', async () => {
  const tela = carregarTela();
  await tela.falhar(0, 'Falha de leitura da planilha');
  assert.match(tela.resultado().textContent, /Falha de leitura da planilha/);
  tela.digitar('maria');
  tela.dispararBusca();
  await tela.responder(1, pagina([paciente]));
  assert.match(tela.resultado().textContent, /MARIA DE SOUZA/);
  assert.doesNotMatch(tela.resultado().textContent, /Falha de leitura/);
});
