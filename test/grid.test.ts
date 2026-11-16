import svgpath from "svgpath";
import { describe, expect, test } from "vitest";
import { readIcons, type Shape } from "../scripts/read-icons";

// Stroke centres must stay inside this box. A 1px stroke centred on 1.5
// fills pixel 1, so the icon covers pixels 1 to 13 with 7 as its centre.
const MIN = 1.5;
const MAX = 13.5;

const onHalfPixel = (value: number) =>
  Math.abs((((value % 1) + 1) % 1) - 0.5) < 1e-6;
const isWhole = (value: number) => Math.abs(value - Math.round(value)) < 1e-6;
const isStroked = (shape: Shape) => shape.attributes.stroke !== "none";

type Point = [x: number, y: number];
type Segment = { command: string; from: Point; to: Point };

function pathSegments(d: string): Segment[] {
  const segments: Segment[] = [];
  let subpathStart: Point = [0, 0];
  svgpath(d)
    .abs()
    .iterate((segment, _index, x, y) => {
      const command = segment[0];
      const from: Point = [x, y];
      const values = segment.slice(1).map(Number);
      let to: Point;
      if (command === "H") to = [values[0], y];
      else if (command === "V") to = [x, values[0]];
      else if (command === "Z") to = subpathStart;
      else to = [values.at(-2) ?? x, values.at(-1) ?? y];
      if (command === "M") subpathStart = to;
      segments.push({ command, from, to });
    });
  return segments;
}

function problems(shape: Shape): string[] {
  const found: string[] = [];
  const n = (key: string) => Number(shape.attributes[key]);
  const checkInside = (label: string, ...values: number[]) => {
    if (!isStroked(shape)) return;
    for (const value of values) {
      if (value < MIN - 1e-6 || value > MAX + 1e-6) {
        found.push(`${label} reaches ${value}, outside ${MIN} to ${MAX}`);
      }
    }
  };

  if (shape.tag === "path") {
    for (const { command, from, to } of pathSegments(shape.attributes.d)) {
      checkInside(`${command} segment`, ...to);
      if (!isStroked(shape) || !["L", "H", "V", "Z"].includes(command))
        continue;
      const [x1, y1] = from;
      const [x2, y2] = to;
      if (y1 === y2 && x1 !== x2 && !onHalfPixel(y1)) {
        found.push(`horizontal line at y=${y1} is not on a half pixel`);
      }
      if (x1 === x2 && y1 !== y2 && !onHalfPixel(x1)) {
        found.push(`vertical line at x=${x1} is not on a half pixel`);
      }
    }
  }

  if (shape.tag === "rect" && isStroked(shape)) {
    const [x, y, width, height] = [n("x"), n("y"), n("width"), n("height")];
    checkInside("rect", x, y, x + width, y + height);
    if (!onHalfPixel(x) || !onHalfPixel(y))
      found.push(`rect at ${x},${y} is not on half pixels`);
    if (!isWhole(width) || !isWhole(height)) {
      found.push(`rect size ${width}x${height} is not whole pixels`);
    }
  }

  if (shape.tag === "circle" && isStroked(shape)) {
    const [cx, cy, r] = [n("cx"), n("cy"), n("r")];
    checkInside("circle", cx - r, cx + r, cy - r, cy + r);
    if (!onHalfPixel(cx - r) || !onHalfPixel(cy - r)) {
      found.push(`circle at ${cx},${cy} r=${r} has edges off half pixels`);
    }
  }

  return found;
}

describe.each(readIcons())("$file", (icon) => {
  test("file name is kebab case", () => {
    expect(icon.file).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("strokes sit on the pixel grid", () => {
    expect(icon.shapes.flatMap(problems)).toEqual([]);
  });
});
