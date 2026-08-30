import select from '@inquirer/select';

import c from '../../utils/ColorTheme';
import { errorMessage, successMessage } from '../../utils/Console';
import {
  activatePersistedTheme,
  getActiveThemeName,
  listThemeDefinitions,
  setActiveThemeName,
} from '../../utils/ThemeConfig';
import { FrodoStubCommand } from '../FrodoCommand';
import ListCmd from './settings-theme-list';
import SetCmd from './settings-theme-set';
import ShowCmd from './settings-theme-show';

/**
 * Interactive theme picker -- lists every discovered theme (see
 * `ThemeConfig.listThemeDefinitions`) with a live-colored name preview and
 * the currently active one marked, lets the user pick with arrow keys +
 * Enter, then applies and persists the selection. Shared by the bare
 * `frodo settings theme` invocation and the `settings` category menu (see
 * `settings.ts`).
 */
export async function runInteractiveThemePicker(): Promise<void> {
  const active = getActiveThemeName();
  const definitions = listThemeDefinitions();
  const chosen = await select({
    message: 'Choose a color theme:',
    choices: definitions.map((def) => ({
      name: `${def.name}${def.name === active ? ' (active)' : ''}`,
      value: def.name,
      description: `${c.heading(def.mode)} -- ${def.description}`,
    })),
    default: active,
  });
  setActiveThemeName(chosen);
  activatePersistedTheme();
  successMessage(`Theme set to "${chosen}".`);
}

export default function setup() {
  const program = new FrodoStubCommand('theme').description(
    'Manage the CLI color theme.'
  );

  program.addCommand(ListCmd().name('list'));
  program.addCommand(ShowCmd().name('show'));
  program.addCommand(SetCmd().name('set'));

  program.action(async () => {
    try {
      await runInteractiveThemePicker();
    } catch (error) {
      errorMessage(`${error}`);
      process.exitCode = 1;
    }
  });

  return program;
}
