// Renders every icon, at every size, as inline SVG in Chromium at 1x and 2x
// and checks that each straight stroke lands on whole pixels.
//
//   bun run sharpness
//
// For every horizontal or vertical stroke at least 2px long, it looks across
// the stroke at its midpoint. The pixels lying wholly inside the stroke must
// render solid. A stroke that straddles two pixel rows has no such pixel and
// fails, as does one the renderer draws faint. Neighbouring shapes don't
// count, so a diagonal's soft edge beside a crisp line is not reported.
// Lists every failing stroke and exits with an error if there are any.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import svgpath from "svgpath";
import { ICONS_DIR, type Icon, readIcons } from "./read-icons";

const MIN_LENGTH = 2;
const CRISP = 0.9;
const CELL = 24;
const COLUMNS = 12;
const SCALES = [1, 2];

type Stroke = { horizontal: boolean; at: number; along: number };

function straightStrokes(icon: Icon): Stroke[] {
  const strokes: Stroke[] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    if (y1 === y2 && Math.abs(x2 - x1) >= MIN_LENGTH) {
      strokes.push({ horizontal: true, at: y1, along: (x1 + x2) / 2 });
    }
    if (x1 === x2 && Math.abs(y2 - y1) >= MIN_LENGTH) {
      strokes.push({ horizontal: false, at: x1, along: (y1 + y2) / 2 });
    }
  };
  for (const { tag, attributes } of icon.shapes) {
    if (attributes.stroke === "none") continue;
    if (tag === "path") {
      svgpath(attributes.d)
        .abs()
        .iterate((segment, _index, x, y) => {
          const [command, ...values] = segment;
          const [a, b] = values.map(Number);
          if (command === "H") add(x, y, a, y);
          if (command === "V") add(x, y, x, a);
          if (command === "L") add(x, y, a, b);
        });
    }
    if (tag === "rect") {
      const [x, y, width, height, rx] = ["x", "y", "width", "height", "rx"].map(
        (key) => Number(attributes[key] ?? 0),
      );
      // Only the straight part between the rounded corners.
      add(x + rx, y, x + width - rx, y);
      add(x + rx, y + height, x + width - rx, y + height);
      add(x, y + rx, x, y + height - rx);
      add(x + width, y + rx, x + width, y + height - rx);
    }
  }
  return strokes;
}

const icons = readIcons().map((icon) => ({
  name: icon.name,
  svg: readFileSync(join(ICONS_DIR, `${icon.path}.svg`), "utf8").replace(
    "<svg ",
    '<svg style="display:block" ',
  ),
  strokes: straightStrokes(icon),
}));

const page = icons
  .map((icon, index) => {
    const left = (index % COLUMNS) * CELL;
    const top = Math.floor(index / COLUMNS) * CELL;
    return `<div style="position:absolute;left:${left}px;top:${top}px">${icon.svg}</div>`;
  })
  .join("");

const browser = await chromium.launch();
const soft: string[] = [];
try {
  const decoder = await browser.newPage();
  for (const scale of SCALES) {
    const tab = await browser.newPage({
      deviceScaleFactor: scale,
      viewport: { width: COLUMNS * CELL, height: 400 },
    });
    await tab.setContent(
      `<body style="margin:0;background:#fff;color:#000">${page}</body>`,
    );
    const png = (await tab.screenshot({ fullPage: true })).toString("base64");
    await tab.close();

    // Decode in the browser so no PNG library is needed.
    const { width, darkness } = await decoder.evaluate(async (data: string) => {
      const response = await fetch(`data:image/png;base64,${data}`);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No 2D canvas");
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height);
      const darkness: number[] = [];
      for (let i = 0; i < pixels.data.length; i += 4) {
        darkness.push(1 - pixels.data[i] / 255);
      }
      return { width: bitmap.width, darkness };
    }, png);

    let crisp = 0;
    let total = 0;
    icons.forEach((icon, index) => {
      const originX = (index % COLUMNS) * CELL;
      const originY = Math.floor(index / COLUMNS) * CELL;
      for (const { horizontal, at, along } of icon.strokes) {
        const centre = ((horizontal ? originY : originX) + at) * scale;
        const across = Math.floor(
          ((horizontal ? originX : originY) + along) * scale,
        );
        // A 1px stroke is `scale` device pixels wide.
        const inside: number[] = [];
        for (
          let p = Math.ceil(centre - scale / 2);
          p + 1 <= centre + scale / 2;
          p++
        ) {
          inside.push(
            horizontal
              ? darkness[p * width + across]
              : darkness[across * width + p],
          );
        }
        const score = inside.length ? Math.min(...inside) : 0;
        total++;
        if (score >= CRISP) {
          crisp++;
          continue;
        }
        const where = horizontal
          ? `horizontal y=${at} at x=${along}`
          : `vertical x=${at} at y=${along}`;
        soft.push(
          `${scale}x  ${icon.name}: ${where} is ${(score * 100).toFixed(0)}% solid`,
        );
      }
    });
    console.log(`${scale}x: ${crisp}/${total} straight strokes crisp`);
  }
} finally {
  await browser.close();
}

if (soft.length) {
  console.log(`\n${soft.length} soft strokes:\n${soft.join("\n")}`);
  process.exit(1);
}
