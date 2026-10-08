import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteCors } from '../../../configManagerOps/FrConfigCorsOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete cors',
    [],
    deploymentTypes
  );

  program
    .description('Delete CORS configuration.')
    .addOption(
      new Option(
        '-n, --name <cors name>',
        'Delete cors from specified name/id, without the type prefix.'
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

      if (!getTokensIsSuccessful) {
        process.exit(1);
      }

      if (options.name) {
        printMessage(`Deleting CORS configuration: "${options.name}"`);
      } else {
        printMessage('Deleting all CORS configurations.');
      }
      const outcome = configManagerDeleteCors(options.name);
      if (!outcome) {
        process.exitCode = 1;
      }
    });

  return program;
}
