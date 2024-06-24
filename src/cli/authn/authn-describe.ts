import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { describeAuthenticationSettings } from '../../ops/AuthenticationSettingsOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLASSIC_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo authn describe');

  program
    .description('Describe authentication settings.')
    .addOption(new Option('--json', 'Output in JSON format.'))
    .addOption(
      new Option('-g, --global', 'Describe global authentication settings.')
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
        // require classic deployment type when doing a global describe
        if (
          !(await getTokens()) ||
          (options.global && !assertDeploymentType(CLASSIC_DEPLOYMENT_TYPE_KEY))
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        verboseMessage(`Describing authentication settings...`);
        const outcome = await describeAuthenticationSettings(
          options.json,
          options.global
        );
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
