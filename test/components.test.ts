import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { readIcons } from "../scripts/read-icons";
import * as exports from "../src";
import { catalog } from "../src/catalog";

const icons = readIcons();

test("the package exports every icon", () => {
  const components = Object.keys(exports).filter(
    (name) => name !== "renderIcon",
  );
  expect(components.sort()).toEqual(icons.map((icon) => icon.name).sort());
});

describe.each(icons)("$name", (icon) => {
  test("renders at its own size with every shape", () => {
    const markup = renderToStaticMarkup(createElement(catalog[icon.name].Icon));
    const { size } = icon;
    expect(markup).toContain(
      `width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"`,
    );
    expect(markup).toContain(`data-icon-name="${icon.name}"`);
    expect(
      markup.match(/<(path|rect|circle|ellipse|line|polyline|polygon) /g),
    ).toHaveLength(icon.shapes.length);
  });
});

test("props override the defaults", () => {
  const markup = renderToStaticMarkup(
    createElement(exports.Check, {
      className: "size-5",
      "aria-hidden": false,
      "aria-label": "Done",
    }),
  );
  expect(markup).toContain('class="size-5"');
  expect(markup).toContain('aria-hidden="false"');
  expect(markup).toContain('aria-label="Done"');
});
