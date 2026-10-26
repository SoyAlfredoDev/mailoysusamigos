import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const selected = [
  ['10.22.09 (2)', 'milo'],
  ['10.22.06 (1)', 'equipo'],
  ['10.22.07 (3)', 'milo-esmoquin'],
  ['10.22.13', 'recepcion'],
  ['10.22.12 (1)', 'peluqueria'],
  ['10.22.14', 'petshop'],
  ['10.22.13 (1)', 'consultorio'],
];
const output = 'public/images/real';
await fs.mkdir(output, { recursive: true });
const manifest = [];
for (const [time, name] of selected) {
  const source = `public/WhatsApp Image 2026-10-21 at ${time}.jpeg`;
  const destination = path.join(output, `${name}.webp`);
  // Preserve photographic content and color. No sharpening, retouching or upscaling.
  const result = await sharp(source).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toFile(destination);
  manifest.push({ source, destination, width: result.width, height: result.height, bytes: result.size });
}
await fs.writeFile('docs/real-photos-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(manifest);
