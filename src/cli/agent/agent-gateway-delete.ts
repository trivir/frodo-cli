import { state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  deleteIdentityGatewayAgent,
  deleteIdentityGatewayAgents,
} from '../../ops/AgentOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo agent gateway delete');

  program
    .description('Delete identity gateway agents.')
    .addOption(
      new Option(
        '-i, --agent-id <agent-id>',
        'Agent id. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all identity gateway agents. Ignored with -i.'
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

        if (!options.agentId && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        // delete by id
        if (options.agentId) {
          verboseMessage(
            `Deleting agent '${
              options.agentId
            }' in realm "${state.getRealm()}"...`
          );
          const outcome = await deleteIdentityGatewayAgent(options.agentId);
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all agents...');
          const outcome = await deleteIdentityGatewayAgents();
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
