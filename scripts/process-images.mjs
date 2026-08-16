import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DESIGNS_DIR = path.join(ROOT, 'Designs');
const OUTPUT_DIR = path.join(ROOT, 'public', 'designs');

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 85;
const THUMB_WIDTH = 600;
const THUMB_HEIGHT = 600;
const THUMB_QUALITY = 80;

const CATEGORIES = ['Brochures-Posters', 'Clothing', 'Logos', 'Socials'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getAllFiles(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        results.push({
          fullPath,
          relativePath: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
          name: entry.name,
          ext,
        });
      }
    }
  }
  return results;
}

async function processImage(inputPath, outputPath, isThumb = false) {
  const maxW = isThumb ? THUMB_WIDTH : MAX_WIDTH;
  const maxH = isThumb ? THUMB_HEIGHT : MAX_HEIGHT;
  const quality = isThumb ? THUMB_QUALITY : JPEG_QUALITY;

  try {
    const metadata = await sharp(inputPath).metadata();
    const needsResize = metadata.width > maxW || metadata.height > maxH;

    let pipeline = sharp(inputPath);

    if (needsResize) {
      pipeline = pipeline.resize(maxW, maxH, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (metadata.hasAlpha) {
      await pipeline
        .png({ quality: Math.min(quality, 100), compressionLevel: 8 })
        .toFile(outputPath.replace(/\.\w+$/, '.png'));
    } else {
      await pipeline
        .jpeg({ quality, mozjpeg: true })
        .toFile(outputPath.replace(/\.\w+$/, '.jpg'));
    }

    const finalPath = fs.existsSync(outputPath.replace(/\.\w+$/, '.jpg'))
      ? outputPath.replace(/\.\w+$/, '.jpg')
      : outputPath.replace(/\.\w+$/, '.png');
      
    return path.basename(finalPath);
  } catch (err) {
    console.error(`    ✗ Error processing ${path.basename(inputPath)}: ${err.message}`);
    fs.copyFileSync(inputPath, outputPath);
    return path.basename(outputPath);
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}

async function main() {
  console.log('🎨 Portfolio Image Processing Script (With Multi-Page Brochures)');
  console.log('================================================================\n');

  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = {};

  for (const category of CATEGORIES) {
    const categoryDir = path.join(DESIGNS_DIR, category);
    const categorySlug = category.toLowerCase();
    
    const outputCatDir = path.join(OUTPUT_DIR, categorySlug);
    const thumbCatDir = path.join(outputCatDir, 'thumbs');
    const origCatDir = path.join(outputCatDir, 'originals');
    
    ensureDir(outputCatDir);
    ensureDir(thumbCatDir);
    ensureDir(origCatDir);

    console.log(`\n📁 Processing: ${category}`);
    manifest[categorySlug] = [];
    const images = getAllFiles(categoryDir);

    // Grouping dictionary for brochures
    const brochureGroups = {};

    for (const img of images) {
      const parts = img.relativePath.split('/');
      let subCategory = null;
      let isBrochure = false;
      let brochureName = null;

      if (category === 'Clothing') {
        subCategory = 'DEBUG';
      } else if (parts.length >= 2) {
        subCategory = parts[0];
      }

      if (parts.length >= 3) {
        isBrochure = true;
        brochureName = parts[parts.length - 2];
      }

      // Title formatting
      let title = img.name.replace(/\.\w+$/, '').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (isBrochure) {
        title = brochureName.replace(/[_-]/g, ' ');
      }

      // Unique file naming
      const safeName = sanitizeFilename(img.relativePath.replace(/\//g, '_'));

      // 1. Process full-size image (compressed)
      const fullOutPath = path.join(outputCatDir, safeName);
      const fullName = await processImage(img.fullPath, fullOutPath, false);

      // 2. Process thumbnail
      const thumbOutPath = path.join(thumbCatDir, safeName);
      const thumbName = await processImage(img.fullPath, thumbOutPath, true);

      // 3. Copy original uncompressed image
      const ext = path.extname(img.fullPath);
      const originalName = safeName.replace(/\.\w+$/, ext);
      const originalDest = path.join(origCatDir, originalName);
      fs.copyFileSync(img.fullPath, originalDest);

      const imageObj = {
        full: `designs/${categorySlug}/${fullName}`,
        thumb: `designs/${categorySlug}/thumbs/${thumbName}`,
        original: `designs/${categorySlug}/originals/${originalName}`,
        title: title,
      };

      // Custom tag: instagram
      let isInstagram = false;
      if (category === 'Socials' && (subCategory === 'AWS' || subCategory === 'AuraWeb')) {
        isInstagram = true;
      }

      if (isBrochure) {
        const groupKey = `${subCategory}-${brochureName}`;
        if (!brochureGroups[groupKey]) {
          brochureGroups[groupKey] = {
            id: sanitizeFilename(groupKey),
            title: title,
            subcategory: subCategory,
            isBrochure: true,
            pages: [],
            instagram: isInstagram
          };
          manifest[categorySlug].push(brochureGroups[groupKey]);
        }
        brochureGroups[groupKey].pages.push(imageObj);
      } else {
        manifest[categorySlug].push({
          id: safeName.replace(/\.\w+$/, ''),
          ...imageObj,
          subcategory: subCategory,
          instagram: isInstagram,
          isBrochure: false
        });
      }
    }

    // Sort brochure pages alphabetically so they appear in correct order
    for (const key of Object.keys(brochureGroups)) {
      brochureGroups[key].pages.sort((a, b) => a.title.localeCompare(b.title) || a.full.localeCompare(b.full));
    }
  }

  const manifestPath = path.join(ROOT, 'src', 'data', 'generated-manifest.json');
  ensureDir(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n====================================');
  console.log(`✅ Done! Processed images saved to: public/designs/`);
  console.log(`📋 Manifest written to: src/data/generated-manifest.json`);
}

main().catch(console.error);
