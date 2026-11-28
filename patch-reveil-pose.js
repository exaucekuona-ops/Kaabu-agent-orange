const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const re = /function ouvrirReveil\(\)\{[\s\S]*?\n\}\nfunction ouvrirTrades\(\)\{/;

const nouveau = `function chargerPoseLib(cb){
  if (window.poseDetection) { cb(); return; }
  var s1 = document.createElement('script');
  s1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
  s1.onload = function(){
    var s2 = document.createElement('script');
    s2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js';
    s2.onload = cb;
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}
function ouvrirReveil(){
  var o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 0%,#0d2a35,#070d14 70%);color:#e9edef;font-family:monospace;overflow:auto';
  o.innerHTML = '<style>@keyframes rvPulse{0%{box-shadow:0 0 0 0 rgba(0,168,132,.6)}70%{box-shadow:0 0 0 24px rgba(0,168,132,0)}100%{box-shadow:0 0 0 0 rgba(0,168,132,0)}}</style>' +
    '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#111b21;border-bottom:1px solid #202c33;font-size:1.2rem;font-weight:700"><i id="rv-retour" class="fa-solid fa-arrow-left" style="cursor:pointer"></i>Réveil (admin)</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;margin-top:30px;padding:0 24px">' +
      '<div style="position:relative;width:100%;max-width:320px">' +
        '<video id="rv-video" autoplay playsinline muted style="width:100%;border-radius:16px;background:#000;transform:scaleX(-1)"></video>' +
        '<canvas id="rv-canvas" style="position:absolute;inset:0;width:100%;height:100%;transform:scaleX(-1)"></canvas>' +
      '</div>' +
      '<div id="rv-statut" style="margin-top:22px;background:#111b21;border:1px solid #202c33;border-radius:16px;padding:16px 20px;width:100%;max-width:320px;text-align:center;color:#ffb648"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px"></i>Chargement du modèle…</div>' +
    '</div>';
  document.body.appendChild(o);
  var rvStream = null, rvBoucle = null, rvDetecteur = null;
  var video = o.querySelector('#rv-video');
  var canvas = o.querySelector('#rv-canvas');
  var ctx = canvas.getContext('2d');
  var statut = o.querySelector('#rv-statut');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(function(stream){
    rvStream = stream;
    video.srcObject = stream;
    video.onloadedmetadata = function(){
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      chargerPoseLib(function(){
        poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: 'SinglePose.Lightning' }).then(function(d){
          rvDetecteur = d;
          statut.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:8px;color:#00a884"></i>Modèle prêt. Place-toi devant la caméra.';
          function boucle(){
            rvDetecteur.estimatePoses(video).then(function(poses){
              ctx.clearRect(0,0,canvas.width,canvas.height);
              if (poses[0]) {
                poses[0].keypoints.forEach(function(k){
                  if (k.score > 0.4) {
                    ctx.beginPath();
                    ctx.arc(k.x, k.y, 6, 0, 2*Math.PI);
                    ctx.fillStyle = '#00e5ff';
                    ctx.fill();
                  }
                });
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
console.log('OK pose réveil');
