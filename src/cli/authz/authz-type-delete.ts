import { ResourceTypeSkeleton } from '@rockcarver/frodo-lib/types/api/ResourceTypesApi';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  deleteResourceTypeById,
  deleteResourceTypes,
  deleteResourceTypeUsingName,
} from '../../ops/ResourceTypeOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz type delete');

  program
    .description('Delete authorization resource types.')
    .addOption(
      new Option(
        '-i, --type-id <type-id>',
        'Variable id. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option(
        '-n, --type-name <type-name>',
        'Resource type name. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all resource types in a realm. Ignored with -i and -n.'
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

        if (!options.typeId && !options.typeName && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome: boolean | ResourceTypeSkeleton;

        // delete by uuid
        if (options.typeId) {
          verboseMessage('Deleting authorization resource type...');
          outcome = await deleteResourceTypeById(options.typeId);
        }
        // delete by name
        else if (options.typeName) {
          verboseMessage('Deleting authorization resource type...');
          outcome = await deleteResourceTypeUsingName(options.typeName);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all authorization resource types...');
          outcome = await deleteResourceTypes();
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
