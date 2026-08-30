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
 * - `heading` -- section/table-column labels. Uses `bold`, not a hue --
 *   this was already the codebase's own convention for describe-view
 *   section titles (`IdmOps.ts`), and unlike a color, bold text has no
 *   background-contrast concern, so it needs no per-theme distinction.
 * - `positive` -- true/active/enabled/valid status values.
 * - `muted` -- shared by two things that both want to look de-emphasized
 *   rather than alarming: table borders/secondary text, and
 *   negative/inactive/false status values (treating "off" as a quieter
 *   state, not an error -- not a merge to eventually split, a deliberate
 *   choice given how few AA-readable colors are available on a light
 *   background).
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
  'positive' | 'muted' | 'debug',
  (text: unknown) => string
>;

/**
 * Built the same way as frodo-lib's base palette -- via
 * TerminalContrastFilter's objective WCAG contrast check, not by eye. Every
 * dark-background color here clears 4.5:1 (WCAG AA normal text) against
 * black.
 */
const DARK_ADDITIONS: CliOnlyColors = {
  positive: c.greenBright,
  muted: c.blackBright,
  debug: c.white,
};

/**
 * Same objective process for the light background -- and it runs into the
 * same scarcity frodo-lib's base palette did: only 5 of the 16 standard
 * ANSI colors clear 4.5:1 against white at all, and frodo-lib's base theme
 * already spends all 5 on `error`/`warning`/`command`/`emphasis`. There is
 * no 6th distinct AA-compliant (4.5:1) color left for `positive`, so it
 * falls back to plain (unstyled) text rather than reusing another intent's
 * color and risking a misleading visual association. `muted` and `debug`
 * are checked against WCAG's looser 3:1 threshold instead -- appropriate
 * for both, since neither is meant to be primary reading content -- which
 * `blackBright` (gray) and `magentaBright` (distinct from `warning`'s
 * plain `magenta`) clear.
 */
const LIGHT_ADDITIONS: CliOnlyColors = {
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
const theme = themeTag as CliThemeApi;
Object.defineProperties(theme, {
  error: { get: () => libTheme(state).error, enumerable: true },
  warning: { get: () => libTheme(state).warning, enumerable: true },
  command: { get: () => libTheme(state).command, enumerable: true },
  emphasis: { get: () => libTheme(state).emphasis, enumerable: true },
  heading: { get: () => c.bold, enumerable: true },
  positive: { get: () => currentCliAdditions().positive, enumerable: true },
  muted: { get: () => currentCliAdditions().muted, enumerable: true },
  debug: { get: () => currentCliAdditions().debug, enumerable: true },
});

export default theme;
