const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const re = /function ouvrirReveil\(\)\{[\s\S]*?\n\}\nfunction ouvrirTrades\(\)\{/;

const nouveau = `function ouvrirReveil(){
  var o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 0%,#0d2a35,#070d14 70%);color:#e9edef;font-family:monospace;overflow:auto';
  o.innerHTML = '<style>@keyframes rvPulse{0%{box-shadow:0 0 0 0 rgba(0,168,132,.6)}70%{box-shadow:0 0 0 24px rgba(0,168,132,0)}100%{box-shadow:0 0 0 0 rgba(0,168,132,0)}}</style>' +
    '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#111b21;border-bottom:1px solid #202c33;font-size:1.2rem;font-weight:700"><i id="rv-retour" class="fa-solid fa-arrow-left" style="cursor:pointer"></i>Réveil (admin)</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;margin-top:30px;padding:0 24px">' +
      '<video id="rv-video" autoplay playsinline muted style="width:100%;max-width:320px;border-radius:16px;background:#000;transform:scaleX(-1)"></video>' +
      '<div style="margin-top:22px;background:#111b21;border:1px solid #202c33;border-radius:16px;padding:16px 20px;width:100%;max-width:320px;text-align:center;color:#ffb648"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px"></i>Étape 2/3 : caméra activée. Détection des pompes à venir.</div>' +
    '</div>';
  document.body.appendChild(o);
  var rvStream = null;
  var video = o.querySelector('#rv-video');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function(stream){
    rvStream = stream;
    video.srcObject = stream;
  }).catch(function(e){
    try { toast('Caméra refusée : ' + e.message); } catch(e2) {}
  });
  o.querySelector('#rv-retour').onclick = function(){
    if (rvStream) { rvStream.getTracks().forEach(function(t){ t.stop(); }); }
    o.remove();
  };
}
function ouvrirTrades(){`;

if (!re.test(c)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(re, nouveau);
fs.writeFileSync(p, c);
console.log('OK caméra réveil');
