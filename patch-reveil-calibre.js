const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const old = `                var ls=rvPt(kps,'left_shoulder'), le=rvPt(kps,'left_elbow'), lw=rvPt(kps,'left_wrist');
                var rs=rvPt(kps,'right_shoulder'), re=rvPt(kps,'right_elbow'), rw=rvPt(kps,'right_wrist');
                var lh=rvPt(kps,'left_hip'), rh=rvPt(kps,'right_hip');
                var corpsOk = ls&&le&&lw&&rs&&re&&rw&&lh&&rh &&
                  ls.score>0.5 && le.score>0.5 && lw.score>0.5 &&
                  rs.score>0.5 && re.score>0.5 && rw.score>0.5 &&
                  lh.score>0.4 && rh.score>0.4;
                var ang = null;
                if (corpsOk) {
                  var angL = rvAngle(ls,le,lw), angR = rvAngle(rs,re,rw);
                  ang = (angL + angR) / 2;
                }`;

const neuf = `                var ls=rvPt(kps,'left_shoulder'), le=rvPt(kps,'left_elbow'), lw=rvPt(kps,'left_wrist');
                var rs=rvPt(kps,'right_shoulder'), re=rvPt(kps,'right_elbow'), rw=rvPt(kps,'right_wrist');
                var nez=rvPt(kps,'nose');
                var corpsOk = ls&&le&&lw&&rs&&re&&rw &&
                  ls.score>0.4 && le.score>0.4 && lw.score>0.4 &&
                  rs.score>0.4 && re.score>0.4 && rw.score>0.4;
                var ang = null;
                if (corpsOk) {
                  var angL = rvAngle(ls,le,lw), angR = rvAngle(rs,re,rw);
                  ang = (angL + angR) / 2;
                }
                if (nez && nez.score>0.4) {
                  if (rvNezHaut===null || nez.y < rvNezHaut) rvNezHaut = nez.y;
                  var seuilBas = rvNezHaut + (canvas.height*0.12);
                  if (nez.y > seuilBas) rvNezBas = true;
                  if (ang===null && rvNezBas) {
                    ang = (nez.y < rvNezHaut + (canvas.height*0.04)) ? 170 : 70;
                  }
                }`;

if (!c.includes(old)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(old, neuf);
c = c.replace("var rvEtat = 'haut', rvCompteur = 0;", "var rvEtat = 'haut', rvCompteur = 0, rvNezHaut = null, rvNezBas = false;");
fs.writeFileSync(p, c);
console.log('OK calibré réveil');
