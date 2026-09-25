#!/data/data/com.termux/files/usr/bin/bash
cd ~/kaabu-agent-app || exit 1
NOM="Télécom rdc"
SRC=~/icone-source.png
[ -f "$SRC" ] || { echo "Il manque icone.png dans Téléchargements"; exit 1; }
command -v magick >/dev/null || command -v convert >/dev/null || pkg install -y imagemagick
IM=$(command -v magick || command -v convert)
RES=android/app/src/main/res
declare -A LEG=( [mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192 )
declare -A FOR=( [mdpi]=108 [hdpi]=162 [xhdpi]=216 [xxhdpi]=324 [xxxhdpi]=432 )
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p $RES/mipmap-$d
  L=${LEG[$d]}; F=${FOR[$d]}; I=$((F*66/100))
  $IM "$SRC" -resize ${L}x${L}^ -gravity center -extent ${L}x${L} $RES/mipmap-$d/ic_launcher.png
  cp $RES/mipmap-$d/ic_launcher.png $RES/mipmap-$d/ic_launcher_round.png
  $IM "$SRC" -resize ${I}x${I} -background none -gravity center -extent ${F}x${F} $RES/mipmap-$d/ic_launcher_foreground.png
done
BG="#$($IM "$SRC" -format '%[hex:p{2,2}]' info: | cut -c1-6)"
[ ${#BG} -eq 7 ] || BG="#111B21"
cat > $RES/values/ic_launcher_background.xml << XML
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$BG</color>
</resources>
XML
sed -i "s|<string name=\"app_name\">[^<]*</string>|<string name=\"app_name\">$NOM</string>|; s|<string name=\"title_activity_main\">[^<]*</string>|<string name=\"title_activity_main\">$NOM</string>|" $RES/values/strings.xml
grep -n "app_name\|title_activity_main" $RES/values/strings.xml
ls $RES/mipmap-anydpi-v26
git add -A android
git commit -m "Nouvelle icône et nom de l'app"
git push
echo "Terminé : GitHub compile le nouvel APK"
