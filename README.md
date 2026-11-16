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
exist to avoid. For 12px and 20px, use the
[versions drawn for those sizes](#12px-and-20px-icons). At 32px (2x screens, or `className="size-8"`) every stroke
still lands on whole device pixels.

Each icon is its own module and the package has no side effects, so bundlers
include only the icons you import. To import a single icon directly:

```ts
import { Bot } from "@nitric/suga-icons/icons/bot";
```

The source SVGs ship too, at `@nitric/suga-icons/svg/<name>.svg`.

## 12px and 20px icons

A 16px icon shown at another size stops being sharp. Shrunk to 12px or less,
its strokes thin to well under a pixel and render faint and grey. Enlarged to
20px, its strokes become 1.25px wide and land between pixels. So some icons
also come drawn separately for 12px and 20px, each with true 1px strokes on
that size's own pixel grid, matching the weight of the 16px set.

Each size has its own export, named with the size as a suffix, so one file can
use all three:

```tsx
import { Plus, Plus12, Plus20 } from "@nitric/suga-icons";

<Plus12 />  // 12 by 12
<Plus />    // 16 by 16
<Plus20 />  // 20 by 20
```

They render an `<svg>` at their own size and otherwise behave like the 16px
icons. To import one directly, put the size in the path:
`@nitric/suga-icons/icons/12/plus`, and `@nitric/suga-icons/svg/12/plus.svg`
for the source.

- Use 12px icons in very small spots, such as inside an 18px circle or a 16px
  badge.
- Use 20px icons where an icon sits alone and a 16px one looks undersized, such
  as in a 40px tile or a 56px empty state, and for controls shown at 20px on
  phones.
- Use 16px icons everywhere else.

Each icon is for its own size only. Like the 16px ones, a 12px or 20px icon
stays sharp at 2x its size and blurs at any other size, so don't scale
`Plus20` down to 16px or `Plus` up to 20px; use the version drawn for that
size. Only some icons have 12px and 20px versions:

- 12px: Clock, GitBranch, Plus, Refresh, User, Webhook, Wrench, X
- 20px: Archive, CalendarClock, ChevronLeft, FilePen, FileText, Globe, Inbox,
  Library, MessageCircle, MessageSquareOff, Monitor, Pencil, PencilLine, Plus,
  RefreshCcw, Search, Settings, ShieldCheck, SmilePlus, Upload, User, X

## Drawing an icon

Icons live in `icons/` as SVG files, one per icon. The file name is the icon's
name in kebab case (`message-circle.svg` becomes `MessageCircle`). 12px and
20px versions live in `icons/12/` and `icons/20/` under the same file name as
the 16px icon (`icons/12/plus.svg` becomes `Plus12`); every one needs a 16px
version and must read as the same icon. Run `bun run generate` to rebuild the
React components from them.

- Draw in the 16 by 16 view box, inside 1.5 to 13.5, centred on 7.5. At 12px
  draw inside 1.5 to 9.5, centred on 5.5, and at 20px inside 1.5 to 17.5,
  centred on 9.5. Each keeps the 16px grid's margins: one empty pixel before
  the drawing and two after it.
- Put horizontal and vertical lines on `.5` coordinates. Give stroked
  rectangles `.5` corners and whole-number sizes, and stroked circles a radius
  that puts their edges on `.5`.
- Prefer horizontals, verticals and 1:1 or 2:1 diagonals; other angles blur.
- Round caps and joins, and a corner radius of 1.5 to 2.5 on containers (2 to
  2.5 at 20px).
- Draw a 12px or 20px version for its size rather than scaling the 16px one:
  keep the strokes 1px and snap every line back onto the grid. At 12px,
  simplify where detail would merge, such as GitBranch's smaller nodes.
- Each file starts with the standard `<svg>` line and has one self-closing
  shape per line. The generator rejects anything else.

`bun run test` checks the grid rules in the source at every size.
`bun run sharpness` renders every icon at every size in Chromium at 1x and 2x
and fails if any straight stroke doesn't come out solid; CI runs both.
`bun run audit -- --only bot,send` writes `audit/sheet.png` for review,
showing each icon at 1x, at 2x and with its 1x pixels zoomed, with its 12px
and 20px versions beside it. `bun run preview` serves a searchable gallery of
every icon.

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
