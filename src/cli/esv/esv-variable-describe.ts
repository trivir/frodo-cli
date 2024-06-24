import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { describeVariable } from '../../ops/cloud/VariablesOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo esv variable describe');

  program
    .description('Describe variables.')
    .addOption(
      new Option(
        '-i, --variable-id <variable-id>',
        'Variable id.'
      ).makeOptionMandatory()
    )
    .addOption(new Option('--json', 'Output in JSON format.'))
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
        verboseMessage(`Describing variable ${options.variableId}...`);
        const outcome = await describeVariable(
          options.variableId,
          options.json
        );
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
