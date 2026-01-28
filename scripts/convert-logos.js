/**
 * Convert SVG logos to PNG for email compatibility
 * Run with: node scripts/convert-logos.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '../public/images/brand');

const conversions = [
  { input: 'logo-wordmark-white.svg', output: 'logo-wordmark-white.png', width: 360, height: 80 },
  { input: 'logo-wordmark-dark.svg', output: 'logo-wordmark-dark.png', width: 360, height: 80 },
  { input: 'logo-circle-dark.svg', output: 'logo-circle-dark.png', width: 100, height: 100 },
];

async function convertLogos() {
  console.log('Converting SVG logos to PNG for email compatibility...\n');
  
  for (const { input, output, width, height } of conversions) {
    const inputPath = path.join(brandDir, input);
    const outputPath = path.join(brandDir, output);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${input} - file not found`);
      continue;
    }
    
    try {
      await sharp(inputPath)
        .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Converted ${input} → ${output}`);
    } catch (err) {
      console.error(`✗ Error converting ${input}:`, err.message);
    }
  }
  
  console.log('\nDone! PNG logos are ready for email use.');
}

convertLogos();
