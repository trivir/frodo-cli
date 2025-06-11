import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  exportAgent,
  exportAllAgents,
  exportRealmAgents,
} from '../../configManagerOps/FrConfigOauth2AgentOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud'];
const { constants } = frodo.utils;
const { readRealms } = frodo.realm;

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export ',
    deploymentTypes
  );

  program
    .description('Export authorization scripts.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to export from. Only the agents from this realm will be exported.'
      )
    )
    .addOption(
      new Option(
        '-n, --agent-name <agent name>',
        'Export specific agent using agentId/agentName.'
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

      // -r/--realm flag has precedence over [realm] arguement
      if (options.realm) {
        realm = options.realm;
      }

      if (await getTokens(false, true, deploymentTypes)) {
        let outcome: boolean;

        // // -n/--script-name
        if (options.agentName) {
          printMessage(
            `Exporting agent ${options.agentName} from the ${state.getRealm()} realm.`
          );
          const originalRealm: string = state.getRealm();
          outcome = await exportAgent(options.agentName);
          // check other realms for the agent
          if (!outcome) {
            for (const realm of await readRealms()) {
              if (outcome) {
                break;
              }
              if (realm.name !== originalRealm) {
                printMessage(
                  `Exporting agent ${options.agentName} from the ${state.getRealm()} realm failed.`
                );
                state.setRealm(realm.name);
                printMessage(
                  `Looking for the ${options.agentName} agent in the ${state.getRealm()} realm now.`
                );
                outcome = await exportAgent(options.agentName);
              }
            }
            if (!outcome) {
              printMessage(
                `Did not find the agent "${options.agentName}" anywhere.`
              );
            }
          }
        }

        // -r/--realm
        else if (realm !== constants.DEFAULT_REALM_KEY) {
          printMessage(`Exporting agents from the ${state.getRealm()} realm.`);
          outcome = await exportRealmAgents();
        }

        // export all, the default
        else {
          printMessage(`Exporting agents from entire tenant.`);
          outcome = await exportAllAgents();
        }

        if (!outcome) {
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
