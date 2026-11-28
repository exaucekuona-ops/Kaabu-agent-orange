const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const old = `                  if (rvFramesHaut >= 3 && rvEtat === 'bas' && (maintenant - rvDernierCompte) > 600) {
                    rvEtat = 'haut';
                    rvCompteur++;
                    rvDernierCompte = maintenant;
                    compteurEl.textContent = rvCompteur + ' / 10';
                  }`;
const neuf = `                  if (rvFramesHaut >= 3 && rvEtat === 'bas' && (maintenant - rvDernierCompte) > 600) {
                    rvEtat = 'haut';
                    rvCompteur++;
                    rvDernierCompte = maintenant;
                    compteurEl.textContent = rvCompteur + ' / 10';
                    if (nez && nez.score>0.4) rvNezHaut = nez.y;
                  }`;

if (!c.includes(old)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(old, neuf);
fs.writeFileSync(p, c);
console.log('OK recalibration réveil');
