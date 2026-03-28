import type { Palette } from './palettes';

export function createTextureFromPixelMap(
  scene: Phaser.Scene,
  key: string,
  pixelMap: string[],
  palette: Palette,
  scale: number = 1
): void {
  const h = pixelMap.length;
  const w = pixelMap[0].length;
  const canvasW = w * scale;
  const canvasH = h * scale;

  const canvasTex = scene.textures.createCanvas(key, canvasW, canvasH);
  if (!canvasTex) return;

  const ctx = canvasTex.getContext();

  for (let row = 0; row < h; row++) {
    const line = pixelMap[row];
    for (let col = 0; col < w; col++) {
      const ch = line[col];
      if (ch === '.') continue;

      const idx = parseInt(ch, 10);
      if (isNaN(idx) || idx < 0 || idx > 3) continue;

      ctx.fillStyle = palette[idx];
      ctx.fillRect(col * scale, row * scale, scale, scale);
    }
  }

  canvasTex.refresh();
}
