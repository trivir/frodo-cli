import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportEndpoints } from '../../../configManagerOps/FrConfigEndpointsOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push endpoints',
    [],
    deploymentTypes
  );

  program
    .description('Import custom endpoints objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Endpoint name, import only specified endpoint'
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

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);
      if (options.name) {
        verboseMessage(
          `Importing config entity endpoint with name "${options.name}"`
        );
      } else {
        verboseMessage('Importing config entity endpoints');
      }
      const outcome = await configManagerImportEndpoints(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
