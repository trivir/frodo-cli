import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteEndpoints } from '../../../configManagerOps/FrConfigEndpointsOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete endpoints',
    [],
    deploymentTypes
  );

  program
    .description('Delete custom endpoint objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Endpoint name. If omitted, deletes all eligible endpoints.'
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

      if (options) {
        verboseMessage('Deleting config entity endpoints');
        const outcome = await configManagerDeleteEndpoints(options.name);
        if (!outcome) process.exitCode = 1;
      } else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        process.exitCode = 1;
        program.help();
      }
    });

  return program;
}
