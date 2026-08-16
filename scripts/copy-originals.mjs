import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const manifestPath = path.join(ROOT, 'src', 'data', 'generated-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const cat of Object.keys(manifest)) {
  for (const img of manifest[cat]) {
    if (img.original && img.original.startsWith('Designs/')) {
      const srcPath = path.join(ROOT, img.original);
      const ext = path.extname(srcPath);
      const newName = img.id + ext;
      const destRel = `designs/${cat}/originals/${newName}`;
      const destFull = path.join(ROOT, 'public', destRel);
      
      fs.mkdirSync(path.dirname(destFull), { recursive: true });
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destFull);
        img.original = destRel;
        console.log(`Copied ${img.original} to public`);
      } else {
        console.error(`Missing original: ${srcPath}`);
      }
    }
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest updated with public original paths!');
