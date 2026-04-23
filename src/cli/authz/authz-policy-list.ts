import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { listPolicies, listPoliciesByPolicySet } from '../../ops/PolicyOps';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz policy list');

  program
    .description('List authorization policies.')
    .addOption(new Option('--set-id <set-id>', 'Policy set id/name.'))
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
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

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome;

        // by policy set
        if (options.setId) {
          verboseMessage(
            `Listing authorization policies in policy set ${options.setId}...`
          );
          outcome = await listPoliciesByPolicySet(options.setId, options.long);
        }
        // all policies
        else {
          verboseMessage(`Listing authorization policies...`);
          outcome = await listPolicies(options.long);
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
