import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  configManagerImportAgents
} from '../../../configManagerOps/FrConfigOauth2AgentOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];
const { constants } = frodo.utils;


export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push oauth2-agents',
    deploymentTypes
  );

  program

    .addOption(
      new Option(
        '-n, --agent-name <agent name>',
        'Import specific agent using agentId/agentName.'
      )
    )

    .addOption(
      new Option(
        '-f, --file <file>',
        'The OAUTH2_AGENTS_CONFIG json file. ex: "/home/trivir/Documents/oauth2-agents.json", or "oauth2-agents.json"'
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

      if (await getTokens(false, true, deploymentTypes)) {
        let outcome: boolean;

        // -n/--script-name
        if (options.agentName) {
          printMessage(
            `Exporting the agent "${options.agentName}" from the ${state.getRealm()} realm.`
          );

          // try and find the agent in current realm
          outcome = await configManagerImportAgents(
            options.agentName,
          );
        }
        if (!outcome) {
          printMessage(
            `Failed to export one or more oauth2 agents. ${options.verbose ? '' : 'Check --verbose for me details.'}`
          );
          process.exitCode = 1;
        }
      }

      // unrecognized combination of options or no options
      else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
      }
    });

  return program;
}
