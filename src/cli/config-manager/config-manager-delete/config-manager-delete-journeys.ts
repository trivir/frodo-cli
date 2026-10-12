import { Option } from 'commander';

import { configManagerDeleteJourneys } from '../../../configManagerOps/FrConfigJourneysOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo config-manager delete journeys', []);
  program
    .description('Delete journeys and their nodes.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Journey name; delete only the specified journey. If omitted, all journeys in the active realm are deleted.'
      )
    )
    .addOption(
      new Option(
        '--dry-run',
        'Show which journeys would be deleted without deleting them.'
      )
    )
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      const getTokensIsSuccessful = await getTokens(false, true);
      if (!getTokensIsSuccessful) {
        process.exitCode = 1;
        return;
      }
      verboseMessage('Deleting journeys.');
      const outcome = await configManagerDeleteJourneys(
        options.name,
        options.dryRun
      );

      if (!outcome) process.exitCode = 1;
    });

  return program;
}
