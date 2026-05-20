import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { deletePolicySetById, deletePolicySets } from '../../ops/PolicySetOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz set delete');

  program
    .description('Delete authorization policy sets.')
    .addOption(new Option('-i, --set-id <set-id>', 'Policy set id/name.'))
    .addOption(
      new Option(
        '-a, --all',
        'Delete all policy sets in a realm. Ignored with -i.'
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

        if (!options.setId && !options.all) {
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

        // delete by id
        if (options.setId) {
          verboseMessage('Deleting authorization policy set...');
          outcome = await deletePolicySetById(options.setId);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all authorization policy sets...');
          outcome = await deletePolicySets();
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
