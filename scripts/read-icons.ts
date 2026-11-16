import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { IconSize } from "../src/render-icon";

export const ICONS_DIR: string = join(import.meta.dirname, "..", "icons");

/**
 * The 16px set lives in icons/. The 12px and 20px versions of some icons are
 * drawn separately for those sizes and live in icons/12/ and icons/20/.
 */
export const SIZES: readonly IconSize[] = [12, 16, 20];

// Every icon file opens with exactly this line for its size, so stroke and
// size defaults can't drift between icons. renderIcon applies the same
// defaults.
export const svgOpen = (size: IconSize): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">`;

const SHAPE =
  /^ {2}<(path|rect|circle|ellipse|line|polyline|polygon)((?: [a-z-]+="[^"]*")+)\/>$/;
const ATTRIBUTE = / ([a-z-]+)="([^"]*)"/g;

export type Shape = {
  tag: string;
  attributes: Record<string, string>;
};

export type Icon = {
  /** The file name without `.svg`, such as `message-circle`. */
  file: string;
  size: IconSize;
  /**
   * The source's path under icons/ without `.svg`: `plus` for 16px,
   * `12/plus` for 12px. The component module and subpath export use it too.
   */
  path: string;
  name: string;
  shapes: Shape[];
};

/**
 * `arrow-up-right` becomes `ArrowUpRight` and `link-2` becomes `Link2`.
 * Other sizes take the size as a suffix: `plus` at 12px becomes `Plus12`.
 */
export function componentName(file: string, size: IconSize): string {
  const name = file
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  if (size === 16) return name;
  // `link-2` at 20px would be `Link220`, which reads as Link 220 and could
  // clash with a 16px `link-220`.
  if (/\d$/.test(name)) {
    throw new Error(
      `${size}/${file}.svg: a name ending in a digit can't take a size suffix yet; decide how to name it first`,
    );
  }
  return `${name}${size}`;
}

/**
 * Parses an icon file. The format is strict, one self-closing shape per line
 * inside the standard opening tag, so the generator never has to guess.
 */
export function parseIcon(file: string, size: IconSize, source: string): Icon {
  const path = size === 16 ? file : `${size}/${file}`;
  const lines = source.trimEnd().split(/\r?\n/);
  if (lines[0] !== svgOpen(size)) {
    throw new Error(
      `${path}.svg: the first line must be the standard ${size}px <svg> tag`,
    );
  }
  if (lines.at(-1) !== "</svg>") {
    throw new Error(`${path}.svg: the last line must be </svg>`);
  }
  const shapes = lines.slice(1, -1).map((line, index) => {
    const match = SHAPE.exec(line);
    if (!match) {
      throw new Error(
        `${path}.svg line ${index + 2}: expected one self-closing shape, got: ${line}`,
      );
    }
    const [, tag, attributes] = match;
    return {
      tag,
      attributes: Object.fromEntries(
        [...attributes.matchAll(ATTRIBUTE)].map(([, key, value]) => [
          key,
          value,
        ]),
      ),
    };
  });
  return { file, size, path, name: componentName(file, size), shapes };
}

/**
 * Every icon at every size, ordered by file name and then size. SIZES is in
 * size order and the sort is stable, so sorting by file name keeps each
 * icon's sizes in order.
 */
export function readIcons(): Icon[] {
  return SIZES.flatMap((size) => {
    const dir = size === 16 ? ICONS_DIR : join(ICONS_DIR, String(size));
    return readdirSync(dir)
      .filter((entry) => entry.endsWith(".svg"))
      .map((entry) => {
        const file = entry.slice(0, -".svg".length);
        return parseIcon(file, size, readFileSync(join(dir, entry), "utf8"));
      });
  }).sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
}
