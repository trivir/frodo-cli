import { FRODO_COLOR_THEME_ENV_KEY, state } from '@rockcarver/frodo-lib';
import fs from 'fs';
import path from 'path';

import { applyCustomThemeOverrides, HUE_NAME_TO_FUNCTION } from './ColorTheme';
import { getConfigPath } from './Config';
import { printMessage } from './Console';

export const FRODO_THEME_ACTIVE_FILENAME = 'Theme.json';
export const FRODO_THEME_DEFINITIONS_DIRNAME = 'themes';

export type ThemeDefinition = {
  name: string;
  description: string;
  mode: 'dark' | 'light';
  colors: Record<string, string>;
};

// Illustrative reference content only -- these are what gets written to
// disk so a user has a real, forkable starting point to copy and edit, not
// the live source of truth for the `dark`/`light` built-ins. Selecting
// `dark`/`light` always resolves via ColorTheme.ts's own code (guaranteed,
// via TerminalContrastFilter, to be readable), regardless of whether these
// files exist, were deleted, or were hand-edited -- only a *different*
// (genuinely custom) theme name is ever actually read from disk.
const BUILT_IN_REFERENCE_DEFINITIONS: Record<
  'dark' | 'light',
  ThemeDefinition
> = {
  dark: {
    name: 'dark',
    description:
      'Optimized for dark-background terminals. This file is a reference copy -- editing it has no effect; copy it to a new file with a different name to make a custom theme.',
    mode: 'dark',
    colors: {
      error: 'redBright',
      warning: 'yellowBright',
      command: 'cyanBright',
      emphasis: 'magentaBright',
      positive: 'greenBright',
      muted: 'blackBright',
      debug: 'white',
    },
  },
  light: {
    name: 'light',
    description:
      'Optimized for light-background terminals. This file is a reference copy -- editing it has no effect; copy it to a new file with a different name to make a custom theme.',
    mode: 'light',
    colors: {
      error: 'red',
      warning: 'magenta',
      command: 'blueBright',
      emphasis: 'blue',
      muted: 'blackBright',
      debug: 'magentaBright',
    },
  },
};

function getThemesDir(): string {
  return path.join(getConfigPath(), FRODO_THEME_DEFINITIONS_DIRNAME);
}

function getActiveThemeFilePath(): string {
  return path.join(getConfigPath(), FRODO_THEME_ACTIVE_FILENAME);
}

/**
 * Writes the built-in themes' reference files to ~/.frodo/themes/ if they
 * aren't already there, so `frodo settings theme list`/`show` (and anyone
 * browsing the directory directly) have something real to discover, copy,
 * and edit into a custom theme -- per "keep settings in separate,
 * discoverable files" rather than a single opaque settings blob.
 */
export function ensureBuiltInThemeFiles(): void {
  const dir = getThemesDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
    for (const def of Object.values(BUILT_IN_REFERENCE_DEFINITIONS)) {
      const filePath = path.join(dir, `${def.name}.json`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(def, null, 2));
      }
    }
  } catch (e) {
    printMessage(
      `Error creating default theme files in ${dir} (${e.message})`,
      'error'
    );
  }
}

function isValidThemeDefinition(value: unknown): value is ThemeDefinition {
  if (!value || typeof value !== 'object') return false;
  const def = value as Partial<ThemeDefinition>;
  if (typeof def.name !== 'string') return false;
  if (def.mode !== 'dark' && def.mode !== 'light') return false;
  if (!def.colors || typeof def.colors !== 'object') return false;
  return Object.values(def.colors).every(
    (hueName) => typeof hueName === 'string' && hueName in HUE_NAME_TO_FUNCTION
  );
}

/**
 * Every theme definition found in ~/.frodo/themes/ -- both the built-in
 * reference files and any custom ones a user has added. Malformed files
 * are skipped with a warning rather than failing the whole listing.
 */
export function listThemeDefinitions(): ThemeDefinition[] {
  const dir = getThemesDir();
  let filenames: string[];
  try {
    filenames = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const definitions: ThemeDefinition[] = [];
  for (const filename of filenames) {
    try {
      const raw = fs.readFileSync(path.join(dir, filename), 'utf8');
      const parsed = JSON.parse(raw);
      if (isValidThemeDefinition(parsed)) {
        definitions.push(parsed);
      } else {
        printMessage(
          `Skipping malformed theme file ${filename}: doesn't match the expected {name, mode, colors} shape.`,
          'warn'
        );
      }
    } catch (e) {
      printMessage(
        `Skipping unreadable theme file ${filename} (${e.message})`,
        'warn'
      );
    }
  }
  return definitions;
}

/**
 * The name of the persisted active theme, or 'dark' if nothing is
 * persisted or the persisted value can't be read. Does not consider the
 * `FRODO_COLOR_THEME` env var -- that's a separate, higher-precedence
 * override handled by frodo-lib's own `resolveThemeMode`.
 */
export function getActiveThemeName(): string {
  try {
    const raw = fs.readFileSync(getActiveThemeFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed?.active === 'string') return parsed.active;
  } catch {
    // no persisted preference yet, or the file is unreadable/malformed
  }
  return 'dark';
}

export function setActiveThemeName(name: string): void {
  fs.writeFileSync(
    getActiveThemeFilePath(),
    JSON.stringify({ active: name }, null, 2)
  );
}

/**
 * Resolves the active theme's full definition. `dark`/`light` always
 * resolve to the code-driven built-in (never read from disk, even if a
 * same-named file exists or was edited) -- anything else is looked up
 * among the discovered files, falling back to `dark` if not found.
 */
export function getActiveThemeDefinition(): ThemeDefinition {
  const activeName = getActiveThemeName();
  if (activeName === 'dark' || activeName === 'light') {
    return BUILT_IN_REFERENCE_DEFINITIONS[activeName];
  }
  const found = listThemeDefinitions().find((def) => def.name === activeName);
  return found ?? BUILT_IN_REFERENCE_DEFINITIONS.dark;
}

/**
 * Applies the persisted active theme at process startup: sets the base
 * dark/light mode, and, only for a genuinely custom (non-built-in) theme,
 * layers its color overrides on top. Built-in `dark`/`light` deliberately
 * never touch the override path, even though their reference files'
 * `colors` would (today) produce the same result -- going through
 * ColorTheme.ts's own code keeps the built-ins correct-by-construction if
 * that code ever changes, rather than silently drifting from a stale copy
 * on disk. Call once, before any output happens (see `app.ts`/`shell.ts`).
 *
 * `FRODO_COLOR_THEME`, if set, wins over anything persisted here -- this
 * function leaves `state`'s override unset in that case, so frodo-lib's own
 * `resolveThemeMode` falls through to the env var exactly as it would with
 * no persisted preference at all. A custom (non-built-in) theme's *color*
 * overrides, however, aren't a mode choice the env var has any way to
 * express, so those still apply even when the env var is picking the mode.
 */
export function activatePersistedTheme(): void {
  ensureBuiltInThemeFiles();
  const activeName = getActiveThemeName();
  const envMode = process.env[FRODO_COLOR_THEME_ENV_KEY];
  const envOverridesMode = envMode === 'dark' || envMode === 'light';

  if (activeName === 'dark' || activeName === 'light') {
    if (!envOverridesMode) state.setColorTheme(activeName);
    return;
  }
  const def = listThemeDefinitions().find((d) => d.name === activeName);
  if (def) {
    if (!envOverridesMode) state.setColorTheme(def.mode);
    applyCustomThemeOverrides(def.colors);
  } else if (!envOverridesMode) {
    state.setColorTheme('dark');
  }
}
