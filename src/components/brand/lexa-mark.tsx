import type { SVGProps } from "react";

/** Path data of the Lexa mark (an "L" inside a speech bubble), in a 340×340 box. */
export const LEXA_MARK_VIEWBOX = "80 87 340 340";
export const LEXA_MARK_PATHS = [
  "M127 93H163Q175 93 175 105V284Q175 320 211 320H373Q385 320 385 332V404Q385 421 369 414L300 378H213Q115 378 115 280V105Q115 93 127 93Z",
  "M209 93H290Q385 93 385 188V286Q385 298 373 298H359Q347 298 347 286V200Q347 125 272 125H209Q197 125 197 113V105Q197 93 209 93Z",
] as const;

/** The Lexa logo mark; takes its colour from `currentColor`. */
export function LexaMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={LEXA_MARK_VIEWBOX} fill="currentColor" aria-hidden focusable="false" {...props}>
      {LEXA_MARK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
