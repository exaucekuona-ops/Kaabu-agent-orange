const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const old1 = `                if (nez && nez.score>0.4) {
                  if (rvNezHaut===null || nez.y < rvNezHaut) rvNezHaut = nez.y;
                  var seuilBas = rvNezHaut + (canvas.height*0.12);
                  if (nez.y > seuilBas) rvNezBas = true;
                  if (ang===null && rvNezBas) {
                    ang = (nez.y < rvNezHaut + (canvas.height*0.04)) ? 170 : 70;
                  }
                }`;
const neuf1 = `                if (nez && nez.score>0.4) {
                  if (rvNezHaut===null || nez.y < rvNezHaut) rvNezHaut = nez.y;
                  if (ang===null) {
                    var plage = canvas.height*0.12;
                    var prop = Math.max(0, Math.min(1, (nez.y - rvNezHaut) / plage));
                    ang = 170 - prop*100;
                  }
                }`;

const old2 = `                if (ang!==null) {
                  if (ang < 90) rvEtat = 'bas';
                  else if (ang > 160 && rvEtat === 'bas') {
                    rvEtat = 'haut';
                    rvCompteur++;
                    compteurEl.textContent = rvCompteur + ' / 10';
                  }
                }`;
const neuf2 = `                if (ang!==null) {
                  rvAngLiss = (rvAngLiss===null) ? ang : (rvAngLiss*0.7 + ang*0.3);
                  var maintenant = Date.now();
                  if (rvAngLiss < 85) { rvFramesBas++; rvFramesHaut = 0; }
                  else if (rvAngLiss > 165) { rvFramesHaut++; rvFramesBas = 0; }
                  else { rvFramesBas = 0; rvFramesHaut = 0; }
                  if (rvFramesBas >= 3) rvEtat = 'bas';
                  if (rvFramesHaut >= 3 && rvEtat === 'bas' && (maintenant - rvDernierCompte) > 600) {
                    rvEtat = 'haut';
                    rvCompteur++;
                    rvDernierCompte = maintenant;
                    compteurEl.textContent = rvCompteur + ' / 10';
                  }
                }`;

if (!c.includes(old1) || !c.includes(old2)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(old1, neuf1).replace(old2, neuf2);
c = c.replace(
  "var rvEtat = 'haut', rvCompteur = 0, rvNezHaut = null, rvNezBas = false;",
  "var rvEtat = 'haut', rvCompteur = 0, rvNezHaut = null, rvAngLiss = null, rvFramesBas = 0, rvFramesHaut = 0, rvDernierCompte = 0;"
);
fs.writeFileSync(p, c);
console.log('OK stabilisation réveil');
