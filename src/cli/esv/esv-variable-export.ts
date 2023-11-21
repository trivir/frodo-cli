import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  exportVariablesToFile,
  exportVariablesToFiles,
  exportVariableToFile,
} from '../../ops/VariablesOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo esv variable export');

program
  .description('Export variables.')
  .addOption(
    new Option(
      '-i, --variable-id <variable-id>',
      'Variable id. If specified, -a and -A are ignored.'
    )
  )
  .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
  .addOption(
    new Option(
      '-a, --all',
      'Export all variables to a single file. Ignored with -i.'
    )
  )
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export all variables to separate files (*.variable.json) in the current directory. Ignored with -i or -a.'
    )
  )
  .addOption(
    new Option(
      '--no-decode',
      'Do not include decoded variable value in export'
    ).default(false, 'false')
  )
  .addOption(
    new Option(
      '-N, --no-metadata',
      'Does not include metadata in the export file.'
    )
  )
  .addOption(
    new Option(
      '-S, --sort',
      'Sorts exported .json file(s) in abc order by key.'
    )
  )
  .action(
    // implement command logic inside action handler
    async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );
      if (options.variableId && (await getTokens())) {
        verboseMessage(
          `Exporting variable "${
            options.variableId
          }" from realm "${state.getRealm()}"...`
        );
        await exportVariableToFile(
          options.variableId,
          options.file,
          options.decode,
          options.metadata,
          options.sort
        );
      } else if (options.all && (await getTokens())) {
        verboseMessage('Exporting all variables to a single file...');
        await exportVariablesToFile(
          options.file,
          options.decode,
          options.metadata,
          options.sort
        );
      } else if (options.allSeparate && (await getTokens())) {
        verboseMessage('Exporting all variables to separate files...');
        await exportVariablesToFiles(
          options.decode,
          options.metadata,
          options.sort
        );
      } else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
