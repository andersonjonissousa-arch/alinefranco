// DOM mínimo para exercitar os formulários reais sem navegador ou serviços Google.
class Elemento {
  constructor(tag, texto = '') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.listeners = {};
    this.dataset = {};
    this.disabled = false;
    this._texto = texto;
    this.classList = { toggle: (nome, ativo) => {
      const classes = new Set((this.className || '').split(/\s+/).filter(Boolean));
      if (ativo) classes.add(nome); else classes.delete(nome);
      this.className = [...classes].join(' ');
    } };
  }
  set textContent(texto) { this.children = []; this._texto = String(texto); }
  get textContent() { return this._texto + this.children.map(f => f.textContent).join(''); }
  set value(valor) { this._value = String(valor); }
  get value() {
    if (this._value !== undefined) return this._value;
    if (this.tagName === 'SELECT') return (this.children.find(c => c.selected) || this.children[0] || {}).value || '';
    return '';
  }
  get isConnected() { return Boolean(this.raiz || (this.parentNode && this.parentNode.isConnected)); }
  appendChild(filho) { this.children.push(filho); filho.parentNode = this; return filho; }
  setAttribute(nome, valor) {
    if (['disabled', 'hidden', 'checked', 'selected', 'open'].includes(nome)) this[nome] = true;
    else if (nome.startsWith('data-')) this.dataset[nome.slice(5)] = String(valor);
    else this[nome === 'class' ? 'className' : nome] = String(valor);
  }
  addEventListener(tipo, fn) { (this.listeners[tipo] ||= []).push(fn); }
  emitir(tipo) { for (const fn of this.listeners[tipo] || []) fn({ target: this, preventDefault() {}, stopPropagation() {} }); }
  focus() {}
  contains(outro) { return outro === this || descendentes(this).includes(outro); }
  querySelectorAll(seletor) {
    return descendentes(this).filter(el => {
      if (seletor.startsWith('#')) return el.id === seletor.slice(1);
      if (seletor.startsWith('[')) return el[seletor.slice(1, -1)] !== undefined;
      return el.tagName === seletor.toUpperCase();
    });
  }
  querySelector(seletor) { return this.querySelectorAll(seletor)[0] || null; }
  get elements() { return descendentes(this).filter(el => ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(el.tagName)); }
}

function descendentes(elemento) { return elemento.children.flatMap(filho => [filho, ...descendentes(filho)]); }

module.exports = { Elemento, descendentes };
