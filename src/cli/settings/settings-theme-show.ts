import c, { type CliIntent } from '../../utils/ColorTheme';
import { createTable, printMessage } from '../../utils/Console';
import { getActiveThemeDefinition } from '../../utils/ThemeConfig';
import { FrodoCommand } from '../FrodoCommand';

const PREVIEW_INTENTS: CliIntent[] = [
  'error',
  'warning',
  'positive',
  'command',
  'emphasis',
  'heading',
  'muted',
  'debug',
];

export default function setup() {
  const program = new FrodoCommand('frodo settings theme show', [
    'host',
    'realm',
    'username',
    'password',
    'type',
    'insecure',
    'curlirize',
  ]);

  program
    .description(
      "Show the active color theme and a preview of each intent's color."
    )
    .action(async (options, command) => {
      command.handleDefaultArgsAndOpts(options, command);
      const def = getActiveThemeDefinition();
      printMessage(`${c.heading(def.name)} (${def.mode})`, 'data');
      printMessage(def.description, 'data');
      printMessage('', 'data');
      const table = createTable(['Intent', 'Preview']);
      for (const intent of PREVIEW_INTENTS) {
        table.push([intent, c[intent](intent)]);
      }
      printMessage(table.toString(), 'data');
    });

  return program;
}
