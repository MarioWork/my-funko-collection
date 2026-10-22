// One-off: renders public/icons/icon.svg into the PNG sizes the manifest and iOS need. Run: yarn icons
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ICONS_DIR = join(import.meta.dirname, '..', 'public', 'icons');
const SOURCE = join(ICONS_DIR, 'icon.svg');
const MASKABLE_PADDING_RATIO = 0.2;
const MASKABLE_BACKGROUND = '#004cff';

type Target = { file: string; size: number; isMaskable?: boolean };

const TARGETS: Target[] = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-maskable-512.png', size: 512, isMaskable: true },
];

const svg = await readFile(SOURCE);

for (const target of TARGETS) {
  const inner = target.isMaskable ? Math.round(target.size * (1 - MASKABLE_PADDING_RATIO * 2)) : target.size;
  const rendered = await sharp(svg).resize(inner, inner).png().toBuffer();
  const padding = Math.round((target.size - inner) / 2);

  await sharp(rendered)
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background: MASKABLE_BACKGROUND })
    .png()
    .toFile(join(ICONS_DIR, target.file));
}
