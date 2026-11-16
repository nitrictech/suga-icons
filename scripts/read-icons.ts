import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const ICONS_DIR: string = join(import.meta.dirname, "..", "icons");

// Every icon file opens with exactly this line, so stroke and size defaults
// can't drift between icons. createIcon applies the same defaults.
export const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">';

const SHAPE =
  /^ {2}<(path|rect|circle|ellipse|line|polyline|polygon)((?: [a-z-]+="[^"]*")+)\/>$/;
const ATTRIBUTE = / ([a-z-]+)="([^"]*)"/g;

export type Shape = {
  tag: string;
  attributes: Record<string, string>;
};

export type Icon = {
  file: string;
  name: string;
  shapes: Shape[];
};

/** `arrow-up-right` becomes `ArrowUpRight`, `link-2` becomes `Link2`. */
export function componentName(file: string): string {
  return file
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Parses an icon file. The format is strict, one self-closing shape per line
 * inside the standard opening tag, so the generator never has to guess.
 */
export function parseIcon(file: string, source: string): Icon {
  const lines = source.trimEnd().split(/\r?\n/);
  if (lines[0] !== SVG_OPEN) {
    throw new Error(
      `${file}.svg: the first line must be the standard <svg> tag`,
    );
  }
  if (lines.at(-1) !== "</svg>") {
    throw new Error(`${file}.svg: the last line must be </svg>`);
  }
  const shapes = lines.slice(1, -1).map((line, index) => {
    const match = SHAPE.exec(line);
    if (!match) {
      throw new Error(
        `${file}.svg line ${index + 2}: expected one self-closing shape, got: ${line}`,
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
  return { file, name: componentName(file), shapes };
}

export function readIcons(): Icon[] {
  return readdirSync(ICONS_DIR)
    .filter((entry) => entry.endsWith(".svg"))
    .sort()
    .map((entry) => {
      const file = entry.slice(0, -".svg".length);
      return parseIcon(file, readFileSync(join(ICONS_DIR, entry), "utf8"));
    });
}
