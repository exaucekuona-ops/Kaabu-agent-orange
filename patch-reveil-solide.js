const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const old = `                var ls=rvPt(kps,'left_shoulder'), le=rvPt(kps,'left_elbow'), lw=rvPt(kps,'left_wrist');
                var rs=rvPt(kps,'right_shoulder'), re=rvPt(kps,'right_elbow'), rw=rvPt(kps,'right_wrist');
                var sL=(ls&&le&&lw)?(ls.score+le.score+lw.score):0;
                var sR=(rs&&re&&rw)?(rs.score+re.score+rw.score):0;
                var ang = null;
                if (sL>0.9 && sL>=sR) ang = rvAngle(ls,le,lw);
                else if (sR>0.9) ang = rvAngle(rs,re,rw);`;

const neuf = `                var ls=rvPt(kps,'left_shoulder'), le=rvPt(kps,'left_elbow'), lw=rvPt(kps,'left_wrist');
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

if (!c.includes(old)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(old, neuf);
fs.writeFileSync(p, c);
console.log('OK solide réveil');
