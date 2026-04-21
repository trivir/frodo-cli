import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { describePolicySet } from '../../ops/PolicySetOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz set describe');

  program
    .description('Describe authorization policy sets.')
    .addOption(
      new Option(
        '-i, --set-id <set-id>',
        'Policy set id/name.'
      ).makeOptionMandatory()
    )
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

        if (!options.setId) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        if (options.setId) {
          verboseMessage(
            `Describing authorization policy set ${options.setId}...`
          );
          const outcome = await describePolicySet(options.setId, options.json);
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
