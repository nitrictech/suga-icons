import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { componentName, readIcons } from "../scripts/read-icons";

const readme = readFileSync(
  join(import.meta.dirname, "..", "README.md"),
  "utf8",
);
const icons = readIcons();

test.each([12, 20] as const)("the README lists every %ipx icon", (size) => {
  // A list item such as "- 12px: Clock, GitBranch, ..." that may wrap.
  const item = new RegExp(
    `^- ${size}px: ([^]*?)(?=\\r?\\n(?:- |\\r?\\n))`,
    "m",
  ).exec(readme);
  const listed = item?.[1].split(",").map((name) => name.trim());
  expect(listed).toEqual(
    icons
      .filter((icon) => icon.size === size)
      .map((icon) => componentName(icon.file, 16)),
  );
});
