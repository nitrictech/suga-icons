import {
  type ComponentType,
  createElement,
  type ReactElement,
  type SVGProps,
} from "react";

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = ComponentType<IconProps>;

/** The sizes icons are drawn for. Each size has its own view box. */
export type IconSize = 12 | 16 | 20;

/** The shapes inside an icon's `<svg>`: element names and their React props. */
export type IconNode = readonly (readonly [
  tag: string,
  props: Readonly<Record<string, string>>,
])[];

/**
 * Renders an icon drawn in a `size` by `size` view box. It shows at that size
 * unless a class sizes it, and takes its colour from the surrounding text.
 */
export function renderIcon(
  name: string,
  node: IconNode,
  props: IconProps,
  size: IconSize = 16,
): ReactElement {
  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      "data-icon-name": name,
      ...props,
    },
    ...node.map(([tag, shapeProps]) => createElement(tag, shapeProps)),
  );
}
