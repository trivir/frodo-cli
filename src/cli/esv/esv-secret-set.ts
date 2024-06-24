import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { setSecretDescription } from '../../ops/cloud/SecretsOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo esv secret set');

  program
    .description('Set secret description.')
    .addOption(new Option('-i, --secret-id <secret-id>', 'Secret id.'))
    .addOption(new Option('--description <description>', 'Secret description.'))
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
        // require cloud deployment type
        if (
          !(await getTokens()) ||
          !assertDeploymentType(CLOUD_DEPLOYMENT_TYPE_KEY)
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        verboseMessage('Setting secret description...');
        const outcome = await setSecretDescription(
          options.secretId,
          options.description
        );
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
