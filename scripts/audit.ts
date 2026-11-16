// Draws a review sheet of icons as Chromium renders them at 1x.
//
//   bun run audit                      every icon
//   bun run audit -- --only bot,send   just these files
//
// Writes audit/sheet.png: each icon at 1x, at 2x, and its 1x pixels zoomed
// 8 times, so blur and stray pixels are easy to spot. `bun run sharpness`
// does the measuring; this is for looking.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { ICONS_DIR, readIcons } from "./read-icons";

const onlyArgument = process.argv.indexOf("--only");
const only =
  onlyArgument === -1 ? null : process.argv[onlyArgument + 1].split(",");
const icons = readIcons().filter((icon) => !only || only.includes(icon.file));

const entries = icons.map((icon) => ({
  name: icon.name,
  svg: readFileSync(join(ICONS_DIR, `${icon.file}.svg`), "utf8"),
}));

const page = `<!doctype html>
<style>
  body { margin: 16px; font: 12px system-ui; color: #000; background: #fff; }
  main { display: grid; grid-template-columns: repeat(6, max-content); gap: 16px 32px; }
  figure { margin: 0; display: grid; grid-template-columns: repeat(3, max-content); gap: 8px; align-items: center; }
  figcaption { grid-column: 1 / -1; font-weight: 600; }
  canvas.zoom { width: 128px; height: 128px; image-rendering: pixelated; outline: 1px solid #ddd; }
  .x2 { width: 32px; height: 32px; }
</style>
<main></main>
<script>
  const entries = ${JSON.stringify(entries)};
  const load = (svg) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  const raster = (image) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    canvas.getContext("2d").drawImage(image, 0, 0, 16, 16);
    return canvas;
  };
  window.drawn = (async () => {
    for (const entry of entries) {
      const figure = document.createElement("figure");
      const caption = document.createElement("figcaption");
      caption.textContent = entry.name;
      const image = await load(entry.svg);
      const twoX = image.cloneNode();
      twoX.className = "x2";
      const zoomed = raster(image);
      zoomed.className = "zoom";
      figure.append(caption, raster(image), twoX, zoomed);
      document.querySelector("main").append(figure);
    }
  })();
</script>`;

const browser = await chromium.launch();
try {
  const tab = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: 1400, height: 800 },
  });
  await tab.setContent(page);
  await tab.evaluate("window.drawn");
  mkdirSync("audit", { recursive: true });
  await tab.screenshot({ path: join("audit", "sheet.png"), fullPage: true });
  console.log(`Wrote audit/sheet.png with ${icons.length} icons`);
} finally {
  await browser.close();
}
