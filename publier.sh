#!/data/data/com.termux/files/usr/bin/bash
cd ~/kaabu-agent-app || exit 1
NEW=$(ls -t ~/storage/downloads/index*.html 2>/dev/null | head -1)
URL=$(grep -o "https://[a-z0-9]*\.supabase\.co" docs/index.html | head -1)
KEY=$(grep -o "sb_publishable_[A-Za-z0-9_-]*" docs/index.html | head -1)
if [ -z "$URL" ] || [ -z "$KEY" ]; then echo "URL ou clé introuvable dans docs/index.html"; exit 1; fi
if [ -n "$NEW" ]; then
  cp "$NEW" docs/index.html
  sed -i "s|COLLE_URL|$URL|; s|COLLE_CLE|$KEY|" docs/index.html
else
  echo "Pas de nouveau fichier : republication de docs/index.html"
fi
if grep -q "COLLE_" docs/index.html; then echo "Remplacement échoué"; exit 1; fi
if ! grep -q 'name="build"' docs/index.html; then
  L=$(grep -n "<head>" docs/index.html | head -1 | cut -d: -f1)
  sed -i "${L}r maj-bloc.html" docs/index.html
fi
STAMP=$(date +%Y%m%d-%H%M%S)
sed -i "s|<meta name=\"build\" content=\"[^\"]*\">|<meta name=\"build\" content=\"$STAMP\">|" docs/index.html
git add -A docs
git commit -m "Mise à jour de l'interface $STAMP [skip ci]"
git push
rm -f ~/storage/downloads/index*.html
echo "Terminé : interface publiée sur GitHub Pages ($STAMP)"
