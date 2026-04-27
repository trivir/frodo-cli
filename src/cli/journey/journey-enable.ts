import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { enableJourney } from '../../ops/JourneyOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo journey enable');

  program
    .description('Enable journeys/trees.')
    .addOption(
      new Option('-i, --journey-id <journey>', 'Name of a journey/tree.')
    )
    // .addOption(
    //   new Option(
    //     '-a, --all',
    //     'Enable all the journeys/trees in a realm. Ignored with -i.'
    //   )
    // )
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
        if (!options.journeyId) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        // enable
        if (options.journeyId) {
          const outcome = await enableJourney(options.journeyId);
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
