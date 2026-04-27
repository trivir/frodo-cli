import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importFirstResourceTypeFromFile,
  importResourceTypeByNameFromFile,
  importResourceTypeFromFile,
  importResourceTypesFromFile,
  importResourceTypesFromFiles,
} from '../../ops/ResourceTypeOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz type import');

  program
    .description('Import authorization resource types.')
    .addOption(
      new Option(
        '-i, --type-id <type-uuid>',
        'Resource type uuid. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-n, --type-name <type-name>',
        'Resource type name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the file to import.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all resource types from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all resource types from separate files (*.resourcetype.authz.json) in the current directory. Ignored with -i, -n, or -a.'
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

        if (
          !options.typeId &&
          !options.typeName &&
          !options.file &&
          !options.all &&
          !options.allSeparate
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome: boolean;

        // import by uuid
        if (options.typeId) {
          verboseMessage(
            'Importing authorization resource type by uuid from file...'
          );
          outcome = await importResourceTypeFromFile(
            options.typeId,
            options.file
          );
        }
        // import by name
        else if (options.typeName) {
          verboseMessage(
            'Importing authorization resource type by name from file...'
          );
          outcome = await importResourceTypeByNameFromFile(
            options.typeName,
            options.file
          );
        }
        // -a/--all
        else if (options.all) {
          verboseMessage(
            'Importing all authorization resource types from file...'
          );
          outcome = await importResourceTypesFromFile(options.file);
        }
        // -A/--all-separate
        else if (options.allSeparate) {
          verboseMessage(
            'Importing all authorization resource types from separate files...'
          );
          outcome = await importResourceTypesFromFiles();
        }
        // import first
        else if (options.file) {
          verboseMessage(
            `Importing first authorization resource type from file "${options.file}"...`
          );
          outcome = await importFirstResourceTypeFromFile(options.file);
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
