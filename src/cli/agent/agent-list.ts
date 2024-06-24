import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { listAgents } from '../../ops/AgentOps.js';
import { getTokens } from '../../ops/AuthenticateOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { FrodoCommand } from '../FrodoCommand';

const { CLASSIC_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo agent list');

  program
    .description('List agents.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
    )
    .addOption(new Option('-g, --global', 'List global agents.'))
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
        // require classic deployment type when doing a global list
        if (
          !(await getTokens()) ||
          (options.global && !assertDeploymentType(CLASSIC_DEPLOYMENT_TYPE_KEY))
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        const outcome = await listAgents(options.long, options.global);
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
