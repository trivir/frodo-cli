import { FrodoCommand } from '../FrodoCommand';
import { Option } from 'commander';
import { frodo, state } from '@rockcarver/frodo-lib';
import { printMessage, verboseMessage } from '../../utils/Console';
import { exportVariableToFile, exportVariablesToFile, exportVariablesToFiles } from '../../ops/VariablesOps';

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
      if (await getTokens()) {
        if (options.variableId) {
          verboseMessage(
            `Exporting variable "${
              options.variableId
            }" from realm "${state.getRealm()}"...`
          );
          await exportVariableToFile(options.variableId, options.file);
        } else if (options.all) {
          verboseMessage('Exporting all variables to a single file...');
          await exportVariablesToFile(options.file);
        } else if (options.allSeparate) {
          verboseMessage('Exporting all variables to separate files...');
          await exportVariablesToFiles();
        } else {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exitCode = 1;
        }
      } else {
        printMessage('Unable to get tokens. Exiting...', 'error');
        program.help();
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
