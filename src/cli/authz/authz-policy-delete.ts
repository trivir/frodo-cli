import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  deletePolicies,
  deletePoliciesByPolicySet,
  deletePolicyById,
} from '../../ops/PolicyOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz policy delete');

  program
    .description('Delete authorization policies.')
    .addOption(
      new Option(
        '-i, --policy-id <policy-id>',
        'Policy id/name. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all policies in a realm. Ignored with -i.'
      )
    )
    .addOption(
      new Option('--set-id <set-id>', 'Policy set id/name. Ignored with -i.')
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

        if (!options.policyId && !options.setId && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          return;
        }

        const getTokensisSuccessful = await getTokens();
        if (!getTokensisSuccessful) process.exit(1);

        let outcome: boolean;

        // delete by id
        if (options.policyId) {
          verboseMessage('Deleting authorization policy...');
          outcome = await deletePolicyById(options.policyId);
        }
        // --all -a by policy set
        else if (options.setId && options.all) {
          verboseMessage(
            `Deleting all authorization policies in policy set ${options.setId}...`
          );
          outcome = await deletePoliciesByPolicySet(options.setId);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all authorization policies...');
          outcome = await deletePolicies();
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
