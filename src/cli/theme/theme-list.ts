import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { listThemes } from '../../ops/ThemeOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo theme list');

  program
    .description('List themes.')
    .addOption(
      new Option('-l, --long', 'Long with more fields.').default(false, 'false')
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
        verboseMessage(`Listing themes in realm "${state.getRealm()}"...`);
        const outcome = await listThemes(options.long);
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
