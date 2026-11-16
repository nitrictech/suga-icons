import {
  type ComponentType,
  createElement,
  type ReactElement,
  type SVGProps,
} from "react";

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = ComponentType<IconProps>;

/** The shapes inside an icon's `<svg>`: element names and their React props. */
export type IconNode = readonly (readonly [
  tag: string,
  props: Readonly<Record<string, string>>,
])[];

/**
 * Renders an icon drawn in a 16 by 16 view box. It shows at 16px unless a
 * class sizes it, and takes its colour from the surrounding text.
 */
export function renderIcon(
  name: string,
  node: IconNode,
  props: IconProps,
): ReactElement {
  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: 16,
      height: 16,
      viewBox: "0 0 16 16",
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
