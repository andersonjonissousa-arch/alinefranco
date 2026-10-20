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
      setNumberFormat() { return intervalo; }
    };
    return intervalo;
  }
}

class PlanilhaFalsa {
  constructor() { this.abas = [new AbaFalsa('Página1')]; }
  getId() { return 'planilha-falsa'; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/planilha-falsa'; }
  getSheets() { return this.abas; }
  getSheetByName(nome) { return this.abas.find((a) => a.nome === nome) || null; }
  insertSheet(nome) { const a = new AbaFalsa(nome); this.abas.push(a); return a; }
  deleteSheet(aba) { this.abas = this.abas.filter((a) => a !== aba); }
}

function criarGoogleFalso({ email = 'coordenacao@exemplo.com' } = {}) {
  const planilha = new PlanilhaFalsa();
  const props = {};
  const sessao = { email };
  return {
    planilha,
    sessao,
    globais: {
      console: { log() {}, error() {}, warn() {} },
      Logger: { log() {} },
      SpreadsheetApp: {
        getActiveSpreadsheet: () => planilha,
        openById: () => planilha,
        create: () => planilha
      },
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
        formatDate: (d) => d.toISOString().slice(0, 10)
      }
    }
  };
}

module.exports = { criarGoogleFalso };
