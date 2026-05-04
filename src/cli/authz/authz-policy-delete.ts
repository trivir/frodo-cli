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
        'Policy id/name. If specified, -a cannot be used.'
      ).conflicts(['all'])
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all policies in a realm. Cannot be used with -i.'
      ).conflicts(['policyId'])
    )
    .addOption(
      new Option(
        '--set-id <set-id>',
        'Policy set id/name. Cannot be used with -i.'
      ).conflicts(['policyId'])
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
        // delete by id
        if (options.policyId && (await getTokens())) {
          verboseMessage('Deleting authorization policy...');
          const outcome = await deletePolicyById(options.policyId);
          if (!outcome) process.exitCode = 1;
        }
        // --all -a by policy set
        else if (options.setId && options.all && (await getTokens())) {
          verboseMessage(
            `Deleting all authorization policies in policy set ${options.setId}...`
          );
          const outcome = await deletePoliciesByPolicySet(options.setId);
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all && (await getTokens())) {
          verboseMessage('Deleting all authorization policies...');
          const outcome = await deletePolicies();
          if (!outcome) process.exitCode = 1;
        }
        // unrecognized combination of options or no options
        else {
          printMessage('Unrecognized combination of options or no options...');
          program.help();
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
