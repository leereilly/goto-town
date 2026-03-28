import type { StageConfig } from '../data/stages';
import { GAME_WIDTH, ROAD_TOP, ROAD_BOTTOM, LANE_COUNT, LANE_HEIGHT } from '../config/constants';

interface TreeDef {
  offsetX: number;   // position within the repeating tile
  y: number;         // base y
  trunkH: number;
  crownW: number;
  crownH: number;
  above: boolean;    // true = above road, false = below
}

const TREE_TILE_WIDTH = 320; // repeating tile wider than screen for seamless wrap
const PARALLAX_SPEED = 0.35; // fraction of road speed

function generateTrees(): TreeDef[] {
  const trees: TreeDef[] = [];
  // Above-road trees (bases sit on the grass strip above the road)
  for (let x = 0; x < TREE_TILE_WIDTH; x += 28 + Math.floor(pseudoRandom(x) * 18)) {
    trees.push({
      offsetX: x,
      y: ROAD_TOP - 8,
      trunkH: 3 + Math.floor(pseudoRandom(x + 1) * 3),
      crownW: 6 + Math.floor(pseudoRandom(x + 2) * 6),
      crownH: 8 + Math.floor(pseudoRandom(x + 3) * 12),
      above: true,
    });
  }
  // Below-road trees / bushes
  for (let x = 12; x < TREE_TILE_WIDTH; x += 32 + Math.floor(pseudoRandom(x + 99) * 20)) {
    trees.push({
      offsetX: x,
      y: ROAD_BOTTOM + 2,
      trunkH: 2,
      crownW: 6 + Math.floor(pseudoRandom(x + 100) * 4),
      crownH: 5 + Math.floor(pseudoRandom(x + 101) * 6),
      above: false,
    });
  }
  return trees;
}

// Simple deterministic hash for stable tree generation
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default class RoadRenderer {
  private graphics!: Phaser.GameObjects.Graphics;
  private scrollOffset: number = 0;
  private treeOffset: number = 0;
  private trees: TreeDef[] = [];

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0);
    this.scrollOffset = 0;
    this.treeOffset = 0;
    this.trees = generateTrees();
  }

  update(dt: number, speed: number, stageConfig: StageConfig): void {
    const g = this.graphics;
    g.clear();

    // Sky
    g.fillStyle(stageConfig.skyColor, 1);
    g.fillRect(0, 0, GAME_WIDTH, ROAD_TOP);

    // Skyline buildings
    if (stageConfig.skylineEnabled) {
      this.drawSkyline(g);
    }

    // Grass above road
    g.fillStyle(stageConfig.grassColor, 1);
    g.fillRect(0, ROAD_TOP - 8, GAME_WIDTH, 8);

    // Parallax trees (above road, behind grass)
    this.treeOffset = (this.treeOffset + speed * dt * PARALLAX_SPEED) % TREE_TILE_WIDTH;
    this.drawTrees(g, stageConfig, true);

    // Road surface
    g.fillStyle(stageConfig.roadColor, 1);
    g.fillRect(0, ROAD_TOP, GAME_WIDTH, ROAD_BOTTOM - ROAD_TOP);

    // Grass below road
    g.fillStyle(stageConfig.grassColor, 1);
    g.fillRect(0, ROAD_BOTTOM, GAME_WIDTH, 240 - ROAD_BOTTOM);

    // Parallax trees (below road)
    this.drawTrees(g, stageConfig, false);

    // Road shoulders
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, ROAD_TOP, GAME_WIDTH, 2);
    g.fillRect(0, ROAD_BOTTOM - 2, GAME_WIDTH, 2);

    // Dashed lane markers
    this.scrollOffset = (this.scrollOffset + speed * dt * 0.4) % 20;

    g.fillStyle(stageConfig.laneMarkerColor, 0.7);
    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const y = ROAD_TOP + LANE_HEIGHT * lane;
      for (let x = -this.scrollOffset; x < GAME_WIDTH; x += 20) {
        g.fillRect(x, y - 1, 10, 2);
      }
    }
  }

  private drawTrees(g: Phaser.GameObjects.Graphics, stageConfig: StageConfig, above: boolean): void {
    const darken = (color: number, factor: number): number => {
      const r = Math.floor(((color >> 16) & 0xff) * factor);
      const gr = Math.floor(((color >> 8) & 0xff) * factor);
      const b = Math.floor((color & 0xff) * factor);
      return (r << 16) | (gr << 8) | b;
    };

    const trunkColor = darken(stageConfig.grassColor, 0.5);
    const crownColor = darken(stageConfig.grassColor, 0.75);

    for (const tree of this.trees) {
      if (tree.above !== above) continue;

      // Compute screen x with wrapping
      let sx = tree.offsetX - this.treeOffset;
      if (sx < -tree.crownW) sx += TREE_TILE_WIDTH;
      if (sx > GAME_WIDTH + tree.crownW) continue;

      if (above) {
        const baseY = tree.y;
        // Trunk
        g.fillStyle(trunkColor, 1);
        g.fillRect(sx, baseY - tree.trunkH, 2, tree.trunkH);
        // Crown (triangle approximated with stacked rects)
        g.fillStyle(crownColor, 1);
        const layers = Math.max(3, tree.crownH);
        for (let i = 0; i < layers; i++) {
          const frac = i / layers;
          const w = Math.ceil(tree.crownW * (1 - frac * 0.7));
          const ly = baseY - tree.trunkH - i - 1;
          g.fillRect(Math.floor(sx + 1 - w / 2), ly, w, 1);
        }
      } else {
        const baseY = tree.y;
        // Trunk
        g.fillStyle(trunkColor, 1);
        g.fillRect(sx, baseY, 2, tree.trunkH);
        // Bush crown below road
        g.fillStyle(crownColor, 1);
        const layers = Math.max(2, tree.crownH);
        for (let i = 0; i < layers; i++) {
          const frac = i / layers;
          const w = Math.ceil(tree.crownW * (1 - frac * 0.7));
          const ly = baseY + tree.trunkH + i;
          if (ly >= 240) break;
          g.fillRect(Math.floor(sx + 1 - w / 2), ly, w, 1);
        }
      }
    }
  }

  private drawSkyline(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x1a1a2e, 1);
    const buildings = [
      { x: 10, w: 18, h: 30 },
      { x: 35, w: 12, h: 22 },
      { x: 55, w: 20, h: 38 },
      { x: 82, w: 14, h: 25 },
      { x: 105, w: 22, h: 42 },
      { x: 135, w: 16, h: 28 },
      { x: 160, w: 24, h: 35 },
      { x: 192, w: 12, h: 20 },
      { x: 210, w: 20, h: 32 },
      { x: 238, w: 16, h: 26 },
    ];

    for (const b of buildings) {
      g.fillRect(b.x, ROAD_TOP - 8 - b.h, b.w, b.h);
      // Windows
      g.fillStyle(0xffeb3b, 0.6);
      for (let wy = ROAD_TOP - 8 - b.h + 4; wy < ROAD_TOP - 12; wy += 6) {
        for (let wx = b.x + 3; wx < b.x + b.w - 3; wx += 5) {
          if (Math.random() > 0.3) {
            g.fillRect(wx, wy, 2, 3);
          }
        }
      }
      g.fillStyle(0x1a1a2e, 1);
    }
  }

  destroy(): void {
    this.graphics?.destroy();
  }
}
