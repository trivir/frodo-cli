import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { countManagedObjects } from '../../ops/IdmOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo idm count');

  program
    .description('Count managed objects.')
    .addOption(
      new Option(
        '-o, --managed-object <type>',
        'Type of managed object to count. E.g. "alpha_user", "alpha_role", "user", "role".'
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
        verboseMessage(`Counting managed ${options.managedObject} objects...`);
        const outcome = await countManagedObjects(options.managedObject);
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
