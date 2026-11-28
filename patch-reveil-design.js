const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const re = /function ouvrirReveil\(\)\{[\s\S]*?\n\}\nfunction ouvrirTrades\(\)\{/;

const nouveau = `function ouvrirReveil(){
  var o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 0%,#0d2a35,#070d14 70%);color:#e9edef;font-family:monospace;overflow:auto';
  o.innerHTML = '<style>@keyframes rvPulse{0%{box-shadow:0 0 0 0 rgba(0,168,132,.6)}70%{box-shadow:0 0 0 24px rgba(0,168,132,0)}100%{box-shadow:0 0 0 0 rgba(0,168,132,0)}}</style>' +
    '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#111b21;border-bottom:1px solid #202c33;font-size:1.2rem;font-weight:700"><i id="rv-retour" class="fa-solid fa-arrow-left" style="cursor:pointer"></i>Réveil (admin)</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;margin-top:60px;padding:0 24px">' +
      '<div style="width:110px;height:110px;border-radius:50%;background:#132a1f;display:flex;align-items:center;justify-content:center;font-size:2.6rem;color:#00a884;animation:rvPulse 2s infinite"><i class="fa-solid fa-dumbbell"></i></div>' +
      '<div style="font-weight:700;font-size:1.3rem;margin-top:22px;text-align:center">Réveil forcé</div>' +
      '<div style="color:#8696a0;text-align:center;margin-top:8px;max-width:280px">L\\'alarme ne s\\'arrêtera qu\\'après 10 pompes vérifiées par la caméra.</div>' +
      '<div style="margin-top:28px;background:#111b21;border:1px solid #202c33;border-radius:16px;padding:16px 20px;width:100%;max-width:320px;text-align:center;color:#ffb648"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px"></i>Étape 1/2 : écran prêt. Détection caméra à venir.</div>' +
    '</div>';
  document.body.appendChild(o);
  o.querySelector('#rv-retour').onclick = function(){ o.remove(); };
}
function ouvrirTrades(){`;

if (!re.test(c)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(re, nouveau);
fs.writeFileSync(p, c);
console.log('OK design réveil');
