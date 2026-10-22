import type { PrimaryImageApiModel, FunkoImageApiModel } from '@app-types/models';

const HUE_STEP = 37;
const HUE_MAX = 360;
const LARGE_PX = 2000;
const MEDIUM_PX = 1200;
const SMALL_PX = 480;
const PLACEHOLDER_PX = 24;
const BOX_RATIO = 4 / 3;

function svgDataUri(label: string, hue: number, px: number): string {
  const height = Math.round(px * BOX_RATIO);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${height}" viewBox="0 0 ${px} ${height}"><rect width="100%" height="100%" fill="hsl(${hue} 60% 85%)"/><rect x="10%" y="8%" width="80%" height="84%" rx="6%" fill="hsl(${hue} 55% 55%)"/><text x="50%" y="52%" font-family="sans-serif" font-size="${Math.round(px / 8)}" fill="white" text-anchor="middle">${label}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Deterministic picture stand-ins for mock mode: a coloured box with the funko's name, in the API's three sizes.
export function createMockImageUrls(label: string, seed: number) {
  const hue = (seed * HUE_STEP) % HUE_MAX;

  return {
    url: svgDataUri(label, hue, LARGE_PX),
    mediumUrl: svgDataUri(label, hue, MEDIUM_PX),
    smallUrl: svgDataUri(label, hue, SMALL_PX),
    placeholder: svgDataUri('', hue, PLACEHOLDER_PX),
    width: LARGE_PX,
    height: Math.round(LARGE_PX * BOX_RATIO),
  };
}

export function toPrimaryImage(image: FunkoImageApiModel | undefined): PrimaryImageApiModel | null {
  if (!image) return null;

  const { smallUrl, mediumUrl, placeholder, width, height } = image;

  return { smallUrl, mediumUrl, placeholder, width, height };
}
