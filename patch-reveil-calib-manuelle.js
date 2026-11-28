const fs = require('fs');
const p = 'docs/index.html';
let c = fs.readFileSync(p, 'utf8');

const re = /function ouvrirReveil\(\)\{[\s\S]*?\n\}\nfunction ouvrirTrades\(\)\{/;

const nouveau = `function ouvrirReveil(){
  var o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 0%,#0d2a35,#070d14 70%);color:#e9edef;font-family:monospace;overflow:auto';
  o.innerHTML = '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#111b21;border-bottom:1px solid #202c33;font-size:1.2rem;font-weight:700"><i id="rv-retour" class="fa-solid fa-arrow-left" style="cursor:pointer"></i>Réveil (admin)</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;margin-top:16px;padding:0 24px">' +
      '<div id="rv-compteur" style="font-size:2.4rem;font-weight:700;color:#00e5ff;margin-bottom:10px">0 / 10</div>' +
      '<div style="position:relative;width:100%;max-width:320px">' +
        '<video id="rv-video" autoplay playsinline muted style="width:100%;border-radius:16px;background:#000;transform:scaleX(-1)"></video>' +
        '<canvas id="rv-canvas" style="position:absolute;inset:0;width:100%;height:100%;transform:scaleX(-1)"></canvas>' +
      '</div>' +
      '<div style="display:flex;gap:10px;width:100%;max-width:320px;margin-top:14px">' +
        '<button id="rv-cal-haut" style="flex:1;padding:12px;border-radius:12px;border:1px solid #00e5ff;background:transparent;color:#00e5ff;font-weight:700">1. Position haute</button>' +
        '<button id="rv-cal-bas" style="flex:1;padding:12px;border-radius:12px;border:1px solid #ffb648;background:transparent;color:#ffb648;font-weight:700">2. Position basse</button>' +
      '</div>' +
      '<div id="rv-statut" style="margin-top:16px;background:#111b21;border:1px solid #202c33;border-radius:16px;padding:16px 20px;width:100%;max-width:320px;text-align:center;color:#ffb648">Chargement du modèle…</div>' +
    '</div>';
  document.body.appendChild(o);
  var rvStream=null, rvBoucle=null, rvDetecteur=null;
  var rvNezHaut=null, rvNezBas=null, rvEtat='haut', rvCompteur=0;
  var rvFramesBas=0, rvFramesHaut=0, rvDernierCompte=0, rvDernierNez=null;
  var video=o.querySelector('#rv-video'), canvas=o.querySelector('#rv-canvas'), ctx=canvas.getContext('2d');
  var statut=o.querySelector('#rv-statut'), compteurEl=o.querySelector('#rv-compteur');
  o.querySelector('#rv-cal-haut').onclick = function(){
    if (rvDernierNez==null) { try{toast('Attends que le visage soit détecté');}catch(e){} return; }
    rvNezHaut = rvDernierNez;
    statut.innerHTML = 'Position haute enregistrée (' + Math.round(rvNezHaut) + '). Descends puis touche 2.';
  };
  o.querySelector('#rv-cal-bas').onclick = function(){
    if (rvDernierNez==null) { try{toast('Attends que le visage soit détecté');}catch(e){} return; }
    rvNezBas = rvDernierNez;
    statut.innerHTML = (rvNezHaut!=null && rvNezBas!=null) ? '<i class="fa-solid fa-circle-check" style="margin-right:8px;color:#00a884"></i>Calibré ! Fais tes pompes.' : 'Position basse enregistrée. Touche 1 en position haute.';
  };
  navigator.mediaDevices.getUserMedia({ video:{facingMode:'user'}, audio:false }).then(function(stream){
    rvStream = stream; video.srcObject = stream;
    video.onloadedmetadata = function(){
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      chargerPoseLib(function(){
        poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType:'SinglePose.Lightning' }).then(function(d){
          rvDetecteur = d;
          statut.textContent = 'Mets-toi debout, bras tendus, puis touche "1. Position haute".';
          function boucle(){
            rvDetecteur.estimatePoses(video).then(function(poses){
              ctx.clearRect(0,0,canvas.width,canvas.height);
              if (poses[0]) {
                var kps = poses[0].keypoints;
                kps.forEach(function(k){ if (k.score>0.4){ ctx.beginPath(); ctx.arc(k.x,k.y,6,0,2*Math.PI); ctx.fillStyle='#00e5ff'; ctx.fill(); } });
                var nez = rvPt(kps,'nose');
                if (nez && nez.score>0.4) {
                  rvDernierNez = nez.y;
                  if (rvNezHaut!=null && rvNezBas!=null && rvNezBas>rvNezHaut) {
                    var milieu = (rvNezHaut + rvNezBas) / 2;
                    var maintenant = Date.now();
                    if (nez.y > milieu) { rvFramesBas++; rvFramesHaut=0; } else { rvFramesHaut++; rvFramesBas=0; }
                    if (rvFramesBas >= 3) rvEtat = 'bas';
                    if (rvFramesHaut >= 3 && rvEtat==='bas' && (maintenant-rvDernierCompte)>600) {
                      rvEtat='haut'; rvCompteur++; rvDernierCompte=maintenant;
                      compteurEl.textContent = rvCompteur + ' / 10';
                    }
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
  }).catch(function(e){ try{toast('Caméra refusée : '+e.message);}catch(e2){} });
  o.querySelector('#rv-retour').onclick = function(){
    if (rvBoucle) cancelAnimationFrame(rvBoucle);
    if (rvStream) rvStream.getTracks().forEach(function(t){t.stop();});
    o.remove();
  };
}
function ouvrirTrades(){`;

if (!re.test(c)) { console.log('ERREUR : motif introuvable, rien touché'); process.exit(1); }
c = c.replace(re, nouveau);
fs.writeFileSync(p, c);
console.log('OK calibration manuelle réveil');
