const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const re = /function ouvrirReveil\(\)\{[\s\S]*?\n\}\nfunction ouvrirTrades\(\)\{/;

const nouveau = `function rvAngle(A,B,C){
  var v1x=A.x-B.x, v1y=A.y-B.y, v2x=C.x-B.x, v2y=C.y-B.y;
  var n1=Math.sqrt(v1x*v1x+v1y*v1y), n2=Math.sqrt(v2x*v2x+v2y*v2y);
  if (n1===0||n2===0) return null;
  var cos = Math.max(-1, Math.min(1, (v1x*v2x+v1y*v2y)/(n1*n2)));
  return Math.acos(cos) * 180/Math.PI;
}
function rvPt(kps, nom){ for (var i=0;i<kps.length;i++) if (kps[i].name===nom) return kps[i]; return null; }
function ouvrirReveil(){
  var o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 0%,#0d2a35,#070d14 70%);color:#e9edef;font-family:monospace;overflow:auto';
  o.innerHTML = '<style>@keyframes rvPulse{0%{box-shadow:0 0 0 0 rgba(0,168,132,.6)}70%{box-shadow:0 0 0 24px rgba(0,168,132,0)}100%{box-shadow:0 0 0 0 rgba(0,168,132,0)}}</style>' +
    '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#111b21;border-bottom:1px solid #202c33;font-size:1.2rem;font-weight:700"><i id="rv-retour" class="fa-solid fa-arrow-left" style="cursor:pointer"></i>Réveil (admin)</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;margin-top:20px;padding:0 24px">' +
      '<div id="rv-compteur" style="font-size:2.4rem;font-weight:700;color:#00e5ff;margin-bottom:14px">0 / 10</div>' +
      '<div style="position:relative;width:100%;max-width:320px">' +
        '<video id="rv-video" autoplay playsinline muted style="width:100%;border-radius:16px;background:#000;transform:scaleX(-1)"></video>' +
        '<canvas id="rv-canvas" style="position:absolute;inset:0;width:100%;height:100%;transform:scaleX(-1)"></canvas>' +
      '</div>' +
      '<div id="rv-statut" style="margin-top:22px;background:#111b21;border:1px solid #202c33;border-radius:16px;padding:16px 20px;width:100%;max-width:320px;text-align:center;color:#ffb648"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px"></i>Chargement du modèle…</div>' +
    '</div>';
  document.body.appendChild(o);
  var rvStream = null, rvBoucle = null, rvDetecteur = null;
  var rvEtat = 'haut', rvCompteur = 0;
  var video = o.querySelector('#rv-video');
  var canvas = o.querySelector('#rv-canvas');
  var ctx = canvas.getContext('2d');
  var statut = o.querySelector('#rv-statut');
  var compteurEl = o.querySelector('#rv-compteur');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function(stream){
    rvStream = stream;
    video.srcObject = stream;
    video.onloadedmetadata = function(){
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      chargerPoseLib(function(){
        poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: 'SinglePose.Lightning' }).then(function(d){
          rvDetecteur = d;
          statut.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:8px;color:#00a884"></i>Modèle prêt. Fais tes pompes.';
          function boucle(){
            rvDetecteur.estimatePoses(video).then(function(poses){
              ctx.clearRect(0,0,canvas.width,canvas.height);
              if (poses[0]) {
                var kps = poses[0].keypoints;
                kps.forEach(function(k){
                  if (k.score > 0.4) { ctx.beginPath(); ctx.arc(k.x, k.y, 6, 0, 2*Math.PI); ctx.fillStyle = '#00e5ff'; ctx.fill(); }
                });
                var ls=rvPt(kps,'left_shoulder'), le=rvPt(kps,'left_elbow'), lw=rvPt(kps,'left_wrist');
                var rs=rvPt(kps,'right_shoulder'), re=rvPt(kps,'right_elbow'), rw=rvPt(kps,'right_wrist');
                var sL=(ls&&le&&lw)?(ls.score+le.score+lw.score):0;
                var sR=(rs&&re&&rw)?(rs.score+re.score+rw.score):0;
                var ang = null;
                if (sL>0.9 && sL>=sR) ang = rvAngle(ls,le,lw);
                else if (sR>0.9) ang = rvAngle(rs,re,rw);
                if (ang!==null) {
                  if (ang < 90) rvEtat = 'bas';
                  else if (ang > 160 && rvEtat === 'bas') {
                    rvEtat = 'haut';
                    rvCompteur++;
                    compteurEl.textContent = rvCompteur + ' / 10';
                  }
                }
              }
              rvBoucle = requestAnimationFrame(boucle);
            });
          }
          boucle();
        });
      });
    };
  }).catch(function(e){
    try { toast('Caméra refusée : ' + e.message); } catch(e2) {}
  });
  o.querySelector('#rv-retour').onclick = function(){
    if (rvBoucle) cancelAnimationFrame(rvBoucle);
    if (rvStream) { rvStream.getTracks().forEach(function(t){ t.stop(); }); }
    o.remove();
  };
}
function ouvrirTrades(){`;

if (!re.test(c)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(re, nouveau);
fs.writeFileSync(p, c);
console.log('OK compteur réveil');
