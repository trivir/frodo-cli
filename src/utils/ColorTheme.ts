import {
  type Intent as LibIntent,
  resolveThemeMode,
  state,
  theme as libTheme,
} from '@rockcarver/frodo-lib';
import c from 'tinyrainbow';

/**
 * frodo-cli's own semantic intents, layered on top of frodo-lib's base set
 * (`error`, `warning`, `command`, `emphasis`) with the CLI-specific roles
 * the call-site audit surfaced:
 * - `heading` -- section/table-column labels. Always bold (unlike a hue,
 *   weight has no background-contrast concern), *plus* a hue where the
 *   palette has room for one: `whiteBright` on dark, comfortably clearing
 *   21:1 on black and left unclaimed by every other intent. On light there
 *   is no room left -- the same scarcity `positive` runs into below -- so
 *   `heading` stays bold-only there, not a color choice so much as what
 *   the palette allows.
 * - `positive` -- true/active/enabled/valid status values.
 * - `muted` -- table borders and other secondary decoration/text that's
 *   deliberately meant to look quiet, not a status value -- status values
 *   that read as "off" use `error` instead (see frodo-lib's `Intent`),
 *   since a describe/list table rendering at all already means the
 *   command didn't fail, so reusing `error`'s color for "inactive" doesn't
 *   actually collide with a real error in practice.
 * - `debug` -- frodo-cli's own debug-output type, distinct from `command`.
 *
 * This is the only file in frodo-cli allowed to reference `tinyrainbow`
 * directly (enforced by an ESLint rule), same as before.
 */
export type CliIntent = LibIntent | 'heading' | 'positive' | 'muted' | 'debug';

// `unknown` input, matching frodo-lib's base theme and tinyrainbow's own
// `Formatter` type -- callers routinely color values whose static type is
// wider than `string` (e.g. a status field typed as `string | number | ...`).
type CliOnlyColors = Record<
  'heading' | 'positive' | 'muted' | 'debug',
  (text: unknown) => string
>;

/**
 * Built the same way as frodo-lib's base palette -- via
 * TerminalContrastFilter's objective WCAG contrast check, not by eye. Every
 * dark-background color here clears 4.5:1 (WCAG AA normal text) against
 * black.
 */
const DARK_ADDITIONS: CliOnlyColors = {
  heading: (text: unknown) => c.bold(c.whiteBright(text)),
  positive: c.greenBright,
  muted: c.blackBright,
  debug: c.white,
};

/**
 * Same objective process for the light background -- and it runs into the
 * same scarcity frodo-lib's base palette did: only 5 of the 16 standard
 * ANSI colors clear 4.5:1 against white at all, and frodo-lib's base theme
 * already spends all 5 on `error`/`warning`/`command`/`emphasis`. There is
 * no 6th distinct AA-compliant (4.5:1) color left for `heading` or
 * `positive`, so both fall back to plain (unstyled, or bold-only for
 * `heading`) text rather than reusing another intent's color and risking a
 * misleading visual association. `muted` and `debug` are checked against
 * WCAG's looser 3:1 threshold instead -- appropriate for both, since
 * neither is meant to be primary reading content -- which `blackBright`
 * (gray) and `magentaBright` (distinct from `warning`'s plain `magenta`)
 * clear.
 */
const LIGHT_ADDITIONS: CliOnlyColors = {
  heading: c.bold,
  positive: (text: unknown) => String(text),
  muted: c.blackBright,
  debug: c.magentaBright,
};

const CLI_ADDITIONS: Record<'dark' | 'light', CliOnlyColors> = {
  dark: DARK_ADDITIONS,
  light: LIGHT_ADDITIONS,
};

type CliThemeApi = Record<CliIntent, (text: unknown) => string> &
  ((strings: TemplateStringsArray, ...values: unknown[]) => string);

/**
 * Every named ANSI color a custom theme file (see `ThemeConfig.ts`) can
 * reference by name. Exported so `ThemeConfig.ts` can validate a theme
 * file's `colors` mapping without itself needing to import `tinyrainbow`.
 */
export const HUE_NAME_TO_FUNCTION: Record<string, (text: unknown) => string> = {
  black: c.black,
  red: c.red,
  green: c.green,
  yellow: c.yellow,
  blue: c.blue,
  magenta: c.magenta,
  cyan: c.cyan,
  white: c.white,
  blackBright: c.blackBright,
  redBright: c.redBright,
  greenBright: c.greenBright,
  yellowBright: c.yellowBright,
  blueBright: c.blueBright,
  magentaBright: c.magentaBright,
  cyanBright: c.cyanBright,
  whiteBright: c.whiteBright,
  bold: c.bold,
  dim: c.dim,
};

// A custom theme's per-intent color overrides, applied on top of the
// resolved base (dark/light) theme -- set once at startup via
// `applyCustomThemeOverrides` (see `app.ts`/`shell.ts`, fed by
// `ThemeConfig.getActiveThemeDefinition()`), consulted by every getter
// below before falling through to the base/CLI-default color. A custom
// theme therefore only needs to specify the intents it wants to change.
let customOverrides: Partial<Record<CliIntent, (text: unknown) => string>> = {};

export function applyCustomThemeOverrides(
  colors: Partial<Record<CliIntent, string>>
): void {
  customOverrides = {};
  for (const [intent, hueName] of Object.entries(colors)) {
    const fn = HUE_NAME_TO_FUNCTION[hueName];
    if (fn) customOverrides[intent as CliIntent] = fn;
  }
}

function currentCliAdditions(): CliOnlyColors {
  return CLI_ADDITIONS[resolveThemeMode(state)];
}

/**
 * The CLI's theme API -- frodo-lib's base intents plus this file's own
 * additions, all resolved against the CLI process's single `state`
 * instance. Deliberately does not expose raw `tinyrainbow` hue methods,
 * same reasoning as frodo-lib's `ColorTheme.ts`. The tagged-template form
 * delegates to frodo-lib's parser for `{name ...}` blocks, which only
 * knows the base intents -- CLI-only intents used inline in a message
 * should use the function-call form (`c.heading(...)`) instead.
 */
const themeTag = (strings: TemplateStringsArray, ...values: unknown[]) =>
  libTheme(state)(strings, ...values);

// Object.assign would invoke these getters immediately and copy the
// resulting *value* instead of the getter, freezing the theme at module
// load time -- defineProperties keeps them live, re-resolved on every read
// (matching frodo-lib's own ColorTheme.ts, which has the same requirement).
function intent(
  name: CliIntent,
  fallback: () => (text: unknown) => string
): { get: () => (text: unknown) => string; enumerable: true } {
  return { get: () => customOverrides[name] ?? fallback(), enumerable: true };
}

const theme = themeTag as CliThemeApi;
Object.defineProperties(theme, {
  error: intent('error', () => libTheme(state).error),
  warning: intent('warning', () => libTheme(state).warning),
  command: intent('command', () => libTheme(state).command),
  emphasis: intent('emphasis', () => libTheme(state).emphasis),
  heading: intent('heading', () => currentCliAdditions().heading),
  positive: intent('positive', () => currentCliAdditions().positive),
  muted: intent('muted', () => currentCliAdditions().muted),
  debug: intent('debug', () => currentCliAdditions().debug),
});

export default theme;
