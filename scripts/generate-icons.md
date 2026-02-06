# Génération des icônes PWA pour Jang

## Option 1 : Utiliser un générateur en ligne (Recommandé)

1. Va sur : https://www.pwabuilder.com/imageGenerator
2. Upload l'icône SVG : `public/icons/icon.svg`
3. Télécharge le pack d'icônes
4. Copie les icônes dans `public/icons/`

## Option 2 : Utiliser un outil local

### Installer sharp (Node.js)
```bash
npm install sharp --save-dev
```

### Script de génération
Crée un fichier `scripts/generate-icons.js` :

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons();
```

### Exécuter
```bash
node scripts/generate-icons.js
```

## Icônes requises

- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Apple Touch Icon

Copie `icon-192x192.png` comme `apple-touch-icon.png`
