import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  describeResourceType,
  describeResourceTypeByName,
} from '../../ops/ResourceTypeOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz type describe');

  program
    .description('Describe authorization resource types.')
    .addOption(new Option('-i, --type-id <type-uuid>', 'Resource type uuid.'))
    .addOption(new Option('-n, --type-name <type-name>', 'Resource type name.'))
    .addOption(new Option('--json', 'Output in JSON format.'))
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

        if (!options.typeId && !options.typeName) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome;

        if (options.typeId) {
          verboseMessage(`Describing authorization resource type by uuid...`);
          outcome = await describeResourceType(options.typeId, options.json);
        } else if (options.typeName) {
          verboseMessage(`Describing authorization resource type by name...`);
          outcome = await describeResourceTypeByName(
            options.typeName,
            options.json
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
