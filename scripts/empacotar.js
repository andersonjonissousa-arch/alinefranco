// Junta o código em poucos arquivos para instalar copiando e colando no editor do Apps Script.
// Uso: npm run empacotar  →  gera a pasta dist/
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const src = path.join(raiz, 'src');
const dist = path.join(raiz, 'dist');
const ordem = ['Config.js', 'Regras.js', 'Indicadores.js', 'Db.js', 'Setup.js', 'Main.js', 'Api.js', 'Admissoes.js', 'Compilado.js', 'Autoteste.js'];

const presentes = fs.readdirSync(src).filter((f) => f.endsWith('.js'));
const faltando = presentes.filter((f) => !ordem.includes(f));
if (faltando.length) throw new Error('Inclua na ordem de empacotamento: ' + faltando.join(', '));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'ui'), { recursive: true });

const aviso = '// Arquivo gerado por scripts/empacotar.js a partir de src/. Não edite aqui: edite src/ e gere de novo.\n';
const codigo = ordem.map((f) => `// ===== ${f} =====\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
fs.writeFileSync(path.join(dist, 'Codigo.gs'), aviso + '\n' + codigo);
for (const f of fs.readdirSync(path.join(src, 'ui'))) {
  fs.copyFileSync(path.join(src, 'ui', f), path.join(dist, 'ui', f));
}
fs.copyFileSync(path.join(src, 'appsscript.json'), path.join(dist, 'appsscript.json'));
console.log('dist/ gerado: Codigo.gs, ui/' + fs.readdirSync(path.join(dist, 'ui')).join(', ui/') + ', appsscript.json');
