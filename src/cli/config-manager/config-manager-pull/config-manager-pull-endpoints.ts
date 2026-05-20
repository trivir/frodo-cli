import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportEndpoints } from '../../../configManagerOps/FrConfigEndpointsOps';
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
    'frodo config-manager pull endpoints',
    [],
    deploymentTypes
  );

  program
    .description('Export custom endpoints objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Endpoint name, It only export the endpoint with the name'
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
          `Exporting config entity endpoint with name ${options.name}`
        );
      } else {
        verboseMessage('Exporting all config entity endpoints');
      }
      const outcome = await configManagerExportEndpoints(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
