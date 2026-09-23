const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Autoriser la lecture du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Chargement sécurisé de la page sans utiliser l'étoile qui plante
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n\x1b[32m%s\x1b[0m', ' 🚀 APPLICATION REPARÉE ET LANCÉE !');
    console.log('\x1b[33m%s\x1b[0m', ' 📱 Ouvre Chrome et va sur : http://localhost:3000\n');
});
