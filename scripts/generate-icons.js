const sharp = require('sharp');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('Génération des icônes PWA pour Jang...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ icon-${size}x${size}.png`);
  }

  // Créer apple-touch-icon
  await sharp(inputSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // Créer favicon
  await sharp(inputSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, '../favicon.ico'));
  console.log('✓ favicon.ico');

  console.log('\n✅ Toutes les icônes ont été générées !');
}

generateIcons().catch(console.error);
