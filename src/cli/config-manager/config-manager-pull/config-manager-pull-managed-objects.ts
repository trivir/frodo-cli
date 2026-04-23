import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportManagedObjects } from '../../../configManagerOps/FrConfigManagedObjectsOps';
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
    'frodo config-manager pull managed-objects',
    [],
    deploymentTypes
  );

  program
    .description('Export managed-objects.')
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
          `Exporting config entity managed-object with name ${options.name}`
        );
      } else {
        verboseMessage('Exporting config entity managed-objects');
      }
      const outcome = await configManagerExportManagedObjects(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
