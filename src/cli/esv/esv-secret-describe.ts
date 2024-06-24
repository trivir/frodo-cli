import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { describeSecret } from '../../ops/cloud/SecretsOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo esv secret describe');

  program
    .description('Describe secrets.')
    .addOption(
      new Option(
        '-i, --secret-id <secret-id>',
        'Secret id.'
      ).makeOptionMandatory()
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
        // require cloud deployment type
        if (
          !(await getTokens()) ||
          !assertDeploymentType(CLOUD_DEPLOYMENT_TYPE_KEY)
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        verboseMessage(`Describing secret ${options.secretId}...`);
        const outcome = await describeSecret(options.secretId);
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
