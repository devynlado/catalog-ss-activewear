#!/usr/bin/env node
/**
 * Convert PNG images to optimized WEBP for web
 * - Resizes to max 1920px width (maintains aspect ratio)
 * - 75% quality (ideal balance of quality/size)
 * Run: node scripts/convert-png-to-webp.mjs
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const QUALITY = 75;
const MAX_WIDTH = 1920;
const PUBLIC_IMAGES_DIR = './public/images';

// Folders to scan for PNGs uploaded today
const FOLDERS_TO_SCAN = [
  'factory-tour',
  'warehouse',
  'services'
];

async function convertPngToWebp(inputPath) {
  const { dir, name } = parse(inputPath);
  const outputPath = join(dir, `${name}.webp`);
  
  try {
    // Get original dimensions
    const metadata = await sharp(inputPath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    // Resize if wider than MAX_WIDTH, otherwise keep original size
    let pipeline = sharp(inputPath);
    
    if (originalWidth > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    await pipeline
      .webp({ quality: QUALITY })
      .toFile(outputPath);
    
    // Get new file size
    const newStats = await stat(outputPath);
    const newSizeKB = Math.round(newStats.size / 1024);
    
    const resizeNote = originalWidth > MAX_WIDTH 
      ? ` (resized from ${originalWidth}px to ${MAX_WIDTH}px)`
      : '';
    
    console.log(`✓ ${name}.webp - ${newSizeKB}KB${resizeNote}`);
    return { path: outputPath, sizeKB: newSizeKB };
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
    return null;
  }
}

async function isUploadedToday(filePath) {
  const stats = await stat(filePath);
  const today = new Date();
  const fileDate = new Date(stats.mtime);
  
  return (
    fileDate.getFullYear() === today.getFullYear() &&
    fileDate.getMonth() === today.getMonth() &&
    fileDate.getDate() === today.getDate()
  );
}

async function scanAndConvert() {
  console.log('🔍 Scanning for PNG files uploaded today...');
  console.log(`   Settings: Max ${MAX_WIDTH}px width, ${QUALITY}% quality\n`);
  
  const converted = [];
  const skipped = [];
  
  for (const folder of FOLDERS_TO_SCAN) {
    const folderPath = join(PUBLIC_IMAGES_DIR, folder);
    
    try {
      const files = await readdir(folderPath);
      const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));
      
      if (pngFiles.length > 0) {
        console.log(`📁 ${folder}/`);
      }
      
      for (const file of pngFiles) {
        const filePath = join(folderPath, file);
        
        // Check if file was modified today
        const uploadedToday = await isUploadedToday(filePath);
        
        if (uploadedToday) {
          const result = await convertPngToWebp(filePath);
          if (result) {
            converted.push(result);
          }
        } else {
          skipped.push(filePath);
        }
      }
      
      if (pngFiles.length > 0) console.log('');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error scanning ${folderPath}:`, error.message);
      }
    }
  }
  
  const totalSizeKB = converted.reduce((sum, c) => sum + c.sizeKB, 0);
  
  console.log('📊 Summary:');
  console.log(`   Converted: ${converted.length} files`);
  console.log(`   Total size: ${totalSizeKB}KB (${(totalSizeKB / 1024).toFixed(2)}MB)`);
  console.log(`   Average per file: ${Math.round(totalSizeKB / converted.length)}KB`);
  
  if (skipped.length > 0) {
    console.log(`   Skipped (not from today): ${skipped.length} files`);
  }
}

scanAndConvert().catch(console.error);
