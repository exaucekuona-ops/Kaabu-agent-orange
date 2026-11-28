const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

// 1. ajouter la carte Réveil (admin suprême seulement)
c = c.replace(
  "((typeof moi!=='undefined' && moi && moi.is_supreme) ? carte('ou-c-epargne', 'fa-piggy-bank', 'Épargne PC') : '') + '</div>';",
  "((typeof moi!=='undefined' && moi && moi.is_supreme) ? carte('ou-c-epargne', 'fa-piggy-bank', 'Épargne PC') : '') + ((typeof moi!=='undefined' && moi && moi.is_supreme) ? carte('ou-c-reveil', 'fa-dumbbell', 'Réveil') : '') + '</div>';"
);

// 2. brancher le clic sur la carte
c = c.replace(
  "var ep = o.querySelector('#ou-c-epargne'); if (ep) ep.onclick = function(){ ouvrirEpargne(); };",
  "var ep = o.querySelector('#ou-c-epargne'); if (ep) ep.onclick = function(){ ouvrirEpargne(); };\n  var rv = o.querySelector('#ou-c-reveil'); if (rv) rv.onclick = function(){ ouvrirReveil(); };"
);

// 3. ajouter la fonction ouvrirReveil (écran vide pour l'instant)
c = c.replace(
  "function ouvrirTrades(){",
  "function ouvrirReveil(){\n  var o = document.createElement('div');\n  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0b141a;color:#e9edef;font-family:monospace;padding:20px';\n  o.innerHTML = '<div style=\"display:flex;align-items:center;gap:14px;margin-bottom:20px\"><i id=\"rv-retour\" class=\"fa-solid fa-arrow-left\" style=\"cursor:pointer\"></i><div style=\"font-weight:700;font-size:1.2rem\">Réveil (admin)</div></div><div style=\"text-align:center;color:#8696a0;margin-top:60px\">Étape 1 : écran prêt.<br>La détection précise arrive ensuite.</div>';\n  document.body.appendChild(o);\n  o.querySelector('#rv-retour').onclick = function(){ o.remove(); };\n}\nfunction ouvrirTrades(){"
);

fs.writeFileSync(p, c);
console.log('OK');
