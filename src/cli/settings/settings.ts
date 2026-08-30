import select from '@inquirer/select';

import { errorMessage } from '../../utils/Console';
import { FrodoStubCommand } from '../FrodoCommand';
import ThemeCmd, { runInteractiveThemePicker } from './settings-theme';

/**
 * Settings categories available in the interactive menu. `theme` is the
 * only one today; this list is exactly where a future settings area (e.g.
 * a `frodo settings log-noise-filter` surface for the currently
 * hand-edit-only LoggingNoiseFilter.json) would be added.
 */
const CATEGORIES: { name: string; run: () => Promise<void> }[] = [
  { name: 'Theme', run: runInteractiveThemePicker },
];

export default function setup() {
  const program = new FrodoStubCommand('settings').description(
    'Manage local frodo CLI settings (not remote Ping/AIC configuration -- see "frodo config"/"frodo config-manager" for that).'
  );

  program.addCommand(ThemeCmd().name('theme'));

  program.action(async () => {
    try {
      const category = await select({
        message: 'Choose a settings category:',
        choices: CATEGORIES.map((c) => ({ name: c.name, value: c.name })),
      });
      const chosen = CATEGORIES.find((c) => c.name === category);
      await chosen.run();
    } catch (error) {
      errorMessage(`${error}`);
      process.exitCode = 1;
    }
  });

  return program;
}
