import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importFirstResourceTypeFromFile,
  importResourceTypeByNameFromFile,
  importResourceTypeFromFile,
  importResourceTypesFromFile,
  importResourceTypesFromFiles,
} from '../../ops/ResourceTypeOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz type import');

  program
    .description('Import authorization resource types.')
    .addOption(
      new Option(
        '-i, --type-id <type-uuid>',
        'Resource type uuid. If specified, -n, -a and -A cannot be used.'
      ).conflicts(['typeName', 'all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-n, --type-name <type-name>',
        'Resource type name. If specified, -a and -A cannot be used.'
      ).conflicts(['all', 'allSeparate'])
    )
    .addOption(new Option('-f, --file <file>', 'Name of the file to import.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all resource types from single file. Cannot be used with -i, -n or -A.'
      ).conflicts(['typeId', 'typeName', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all resource types from separate files (*.resourcetype.authz.json) in the current directory. Cannot be used with -i, -n, or -a.'
      ).conflicts(['typeId', 'typeName', 'all'])
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
        // import by uuid
        if (options.typeId && (await getTokens())) {
          verboseMessage(
            'Importing authorization resource type by uuid from file...'
          );
          const outcome = await importResourceTypeFromFile(
            options.typeId,
            options.file
          );
          if (!outcome) process.exitCode = 1;
        }
        // import by name
        else if (options.typeName && (await getTokens())) {
          verboseMessage(
            'Importing authorization resource type by name from file...'
          );
          const outcome = await importResourceTypeByNameFromFile(
            options.typeName,
            options.file
          );
          if (!outcome) process.exitCode = 1;
        }
        // -a/--all
        else if (options.all && (await getTokens())) {
          verboseMessage(
            'Importing all authorization resource types from file...'
          );
          const outcome = await importResourceTypesFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
        // -A/--all-separate
        else if (options.allSeparate && (await getTokens())) {
          verboseMessage(
            'Importing all authorization resource types from separate files...'
          );
          const outcome = await importResourceTypesFromFiles();
          if (!outcome) process.exitCode = 1;
        }
        // import first
        else if (options.file && (await getTokens())) {
          verboseMessage(
            `Importing first authorization resource type from file "${options.file}"...`
          );
          const outcome = await importFirstResourceTypeFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
        // unrecognized combination of options or no options
        else {
          verboseMessage(
            'Unrecognized combination of options or no options...'
          );
          program.help();
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
