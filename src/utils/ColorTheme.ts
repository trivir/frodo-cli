import c, { type Colors } from 'tinyrainbow';

/**
 * Frodo's themed color palette.
 *
 * `tinyrainbow`'s "Bright" (ANSI high-intensity) variants are the specific
 * palette subset that's unreadable on light/white-background terminals --
 * they're designed for emphasis on dark backgrounds. The plain (non-bright)
 * 8-color ANSI palette has adequate contrast on both light and dark terminal
 * backgrounds in virtually all standard terminal themes, so every "Bright"
 * property here is remapped to its plain equivalent. Call sites are
 * unaffected -- `c.cyanBright(...)` etc. keep working, they just render in
 * the plain color now.
 *
 * This re-exports `tinyrainbow`'s default, environment-aware color object,
 * which already computes `NO_COLOR` / `FORCE_COLOR` / `--no-color` /
 * `--color` / TTY / `CI` support once at module load (see `createColors()`
 * in `tinyrainbow`'s source) -- that detection is preserved unchanged here,
 * only the color mapping changes.
 */
const theme: Colors = {
  ...c,
  blackBright: c.black,
  redBright: c.red,
  greenBright: c.green,
  yellowBright: c.yellow,
  blueBright: c.blue,
  magentaBright: c.magenta,
  cyanBright: c.cyan,
  whiteBright: c.white,
};

export default theme;
