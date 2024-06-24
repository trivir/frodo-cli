import { frodo } from '@rockcarver/frodo-lib';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  listAllConfigEntities,
  warnAboutOfflineConnectorServers,
} from '../../ops/IdmOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo idm list');

  program
    .description('List IDM configuration objects.')
    // .addOption(
    //   new Option('-l, --long', 'Long with all fields.').default(false, 'false')
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
        // require platform deployment type
        if (
          !(await getTokens()) ||
          !assertDeploymentType(
            CLOUD_DEPLOYMENT_TYPE_KEY,
            FORGEOPS_DEPLOYMENT_TYPE_KEY
          )
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        verboseMessage('Listing all IDM configuration objects...');
        const outcome = await listAllConfigEntities();
        if (!outcome) process.exitCode = 1;
        await warnAboutOfflineConnectorServers();
      }
      // end command logic inside action handler
    );

  return program;
}
