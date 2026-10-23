// Simula, em memória, os serviços do Google usados pelo sistema, para testar o servidor sem a nuvem.
const crypto = require('node:crypto');

class AbaFalsa {
  constructor(nome) {
    this.nome = nome;
    this.linhas = [];
  }
  getName() { return this.nome; }
  getLastRow() { return this.linhas.length; }
  getMaxRows() { return Math.max(1000, this.linhas.length); }
  setFrozenRows() { return this; }
  setFrozenColumns() { return this; }
  setColumnWidth() { return this; }
  setName(nome) { this.nome = nome; return this; }
  appendRow(valores) { this.linhas.push(valores.map(String)); return this; }
  deleteRow(n) { this.linhas.splice(n - 1, 1); }
  getRange(linha, coluna, nLinhas = 1, nColunas = 1) {
    const aba = this;
    const intervalo = {
      getValues() {
        const out = [];
        for (let r = 0; r < nLinhas; r++) {
          const fonte = aba.linhas[linha - 1 + r] || [];
          const l = [];
          for (let c = 0; c < nColunas; c++) {
            const v = fonte[coluna - 1 + c];
            l.push(v === undefined ? '' : v);
          }
          out.push(l);
        }
        return out;
      },
      setValues(valores) {
        valores.forEach((l, r) => {
          const idx = linha - 1 + r;
          while (aba.linhas.length <= idx) aba.linhas.push([]);
          l.forEach((v, c) => { aba.linhas[idx][coluna - 1 + c] = String(v); });
        });
        return intervalo;
      },
      setFontWeight() { return intervalo; },
      setBackground() { return intervalo; },
      setNumberFormat() { return intervalo; },
      setFontSize() { return intervalo; },
      setFontStyle() { return intervalo; },
      setFontColor() { return intervalo; }
    };
    return intervalo;
  }
}

// Planilhas criadas, por id, para a API do Google Planilhas achar pelo id.
const planilhasPorId = {};
let contadorPlanilhas = 0;

class PlanilhaFalsa {
  constructor(nome) {
    this.abas = [new AbaFalsa('Página1')];
    this.nome = nome || 'Banco';
    this.id = contadorPlanilhas++ ? 'planilha-falsa-' + contadorPlanilhas : 'planilha-falsa';
    planilhasPorId[this.id] = this;
  }
  getName() { return this.nome; }
  getId() { return this.id; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id; }
  getSheets() { return this.abas; }
  getSheetByName(nome) { return this.abas.find((a) => a.nome === nome) || null; }
  insertSheet(nome) { const a = new AbaFalsa(nome); this.abas.push(a); return a; }
  deleteSheet(aba) { this.abas = this.abas.filter((a) => a !== aba); }
}

/**
 * Imita Sheets.Spreadsheets.Values.batchGet: lê intervalos 'ABA'!A2:R e, como a API de verdade,
 * omite as células vazias do fim de cada linha e as linhas vazias do fim.
 */
function batchGetFalso(id, opcoes) {
  const planilha = planilhasPorId[id];
  if (!planilha) throw new Error('Planilha não encontrada: ' + id);
  return {
    valueRanges: opcoes.ranges.map((faixa) => {
      const m = /^'(.+)'!A(\d+):([A-Z]+)$/.exec(faixa);
      const aba = m && planilha.getSheetByName(m[1]);
      if (!aba) throw new Error('Unable to parse range: ' + faixa);
      const nColunas = m[3].split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
      const linhas = aba.linhas.slice(Number(m[2]) - 1).map((l) => {
        const r = l.slice(0, nColunas);
        while (r.length && (r[r.length - 1] === '' || r[r.length - 1] === undefined)) r.pop();
        return r;
      });
      while (linhas.length && !linhas[linhas.length - 1].length) linhas.pop();
      return linhas.length ? { range: faixa, values: linhas } : { range: faixa };
    })
  };
}

function criarGoogleFalso({ email = 'coordenacao@exemplo.com' } = {}) {
  const planilha = new PlanilhaFalsa();
  const props = {};
  const sessao = { email };
  const criadas = [];
  return {
    planilha,
    sessao,
    criadas,
    globais: {
      console: { log() {}, error() {}, warn() {} },
      Logger: { log() {} },
      SpreadsheetApp: {
        getActiveSpreadsheet: () => planilha,
        flush: () => {},
        openById: () => planilha,
        // O banco é a planilha ativa; create só é usado nas exportações.
        create: (nome) => {
          const nova = new PlanilhaFalsa(nome);
          criadas.push(nova);
          return nova;
        }
      },
      Sheets: { Spreadsheets: { Values: { batchGet: batchGetFalso } } },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (k) => props[k] || null,
          setProperty: (k, v) => { props[k] = v; }
        })
      },
      Session: { getActiveUser: () => ({ getEmail: () => sessao.email }) },
      LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
      Utilities: {
        getUuid: () => crypto.randomUUID(),
        formatDate: (d, tz, formato) => (/HH:mm/.test(formato) ? d.toISOString().slice(0, 16).replace('T', ' ') : d.toISOString().slice(0, 10)),
        // Os testes usam o relógio em UTC: a data e a hora do texto viram as mesmas em UTC.
        parseDate: (texto) => new Date(texto.replace(' ', 'T') + 'Z')
      }
    }
  };
}

module.exports = { criarGoogleFalso };
