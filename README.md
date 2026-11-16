# Suga Icons

Icons for React, drawn on a 16px pixel grid so they stay sharp at 16px on 1x
screens.

Most icon sets are drawn on a 24px grid with 2px strokes. Shown at 16px they
shrink to two-thirds: strokes come out about 1.33px wide and land between
pixels, so each line renders as two faint rows instead of one solid one, and
joins look brighter where those faint edges overlap. Every icon here is drawn
for 16px instead: straight strokes are 1px wide and centred on half pixels, so
they fill whole pixel rows.

## Install

```sh
npm install @nitric/suga-icons
```

React 19 or later is required.

## Use

```tsx
import { Bot, Send } from "@nitric/suga-icons";

<Send />                          // 16px, coloured by the surrounding text
<Bot aria-hidden={false} aria-label="Assistant" />
```

Each icon renders an `<svg>` at 16 by 16 and takes its colour from
`currentColor`. Icons are `aria-hidden` by default; pass `aria-hidden={false}`
and an `aria-label` when an icon carries meaning on its own. Any other SVG prop
is passed through.

Keep icons at 16px and leave `strokeWidth` alone. Other sizes and stroke widths
work, but they move strokes off the pixel grid, which is the blur these icons
exist to avoid. At 32px (2x screens, or `className="size-8"`) every stroke
still lands on whole device pixels.

Each icon is its own module and the package has no side effects, so bundlers
include only the icons you import. To import a single icon directly:

```ts
import { Bot } from "@nitric/suga-icons/icons/bot";
```

The source SVGs ship too, at `@nitric/suga-icons/svg/<name>.svg`.

## Drawing an icon

Icons live in `icons/` as SVG files, one per icon. The file name is the icon's
name in kebab case (`message-circle.svg` becomes `MessageCircle`). Run
`bun run generate` to rebuild the React components from them.

- Draw in the 16 by 16 view box, inside 1.5 to 13.5, centred on 7.5.
- Put horizontal and vertical lines on `.5` coordinates. Give stroked
  rectangles `.5` corners and whole-number sizes, and stroked circles a radius
  that puts their edges on `.5`.
- Prefer horizontals, verticals and 1:1 or 2:1 diagonals; other angles blur.
- Round caps and joins, and a corner radius of 1.5 to 2.5 on containers.
- Each file starts with the standard `<svg>` line and has one self-closing
  shape per line. The generator rejects anything else.

`bun run test` checks the grid rules in the source. `bun run sharpness`
renders every icon in Chromium at 1x and 2x and fails if any straight stroke
doesn't come out solid; CI runs both. `bun run audit -- --only bot,send`
writes `audit/sheet.png` for review, showing each icon at 1x, at 2x and with
its 1x pixels zoomed. `bun run preview` serves a searchable gallery of every
icon.

Icons are sharp at whole-number pixel ratios (1x, 2x, 3x). At fractional
ratios, such as 125% or 150% display scaling, and under a CSS transform that
moves them by part of a pixel, strokes stop landing on whole pixels.

## Releasing

Publishing a GitHub release named `vX.Y.Z` runs `.github/workflows/publish.yml`,
which publishes that version to npm through trusted publishing; the repo holds
no npm token. The job waits in the `npm` environment until a required reviewer
approves it from the workflow run in GitHub Actions. Mark the release as a
prerelease to publish under the `next` tag instead of `latest`.

## License

MIT
