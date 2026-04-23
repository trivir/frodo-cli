import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportResourceTypeByNameToFile,
  exportResourceTypesToFile,
  exportResourceTypesToFiles,
  exportResourceTypeToFile,
} from '../../ops/ResourceTypeOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz type export');

  program
    .description('Export authorization resource types.')
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
    .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Export all resource types to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all resource types to separate files (*.resourcetype.authz.json) in the current directory. Ignored with -i, -n, or -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Does not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '-M, --modified-properties',
        'Include modified properties in export (e.g. lastModifiedDate, lastModifiedBy, createdBy, creationDate, etc.)'
      ).default(false, 'false')
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

        // export by uuid
        if (options.typeId) {
          verboseMessage('Exporting authorization resource type to file...');
          outcome = await exportResourceTypeToFile(
            options.typeId,
            options.file,
            options.metadata,
            options.modifiedProperties
          );
        }
        // export by name
        else if (options.typeName) {
          verboseMessage('Exporting authorization resource type to file...');
          outcome = await exportResourceTypeByNameToFile(
            options.typeName,
            options.file,
            options.metadata,
            options.modifiedProperties
          );
        }
        // -a/--all
        else if (options.all) {
          verboseMessage(
            'Exporting all authorization resource types to file...'
          );
          outcome = await exportResourceTypesToFile(
            options.file,
            options.metadata,
            options.modifiedProperties
          );
        }
        // -A/--all-separate
        else if (options.allSeparate) {
          verboseMessage(
            'Exporting all authorization resource types to separate files...'
          );
          outcome = await exportResourceTypesToFiles(
            options.metadata,
            options.modifiedProperties
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
