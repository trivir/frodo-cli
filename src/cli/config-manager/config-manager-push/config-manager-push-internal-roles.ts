import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportInternalRoles } from '../../../configManagerOps/FrConfigInternalRolesOps';
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
    'frodo config-manager push internal-roles',
    [],
    deploymentTypes
  );

  program

    .description('Import internal roles.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Internal role name, imports the specified role name'
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
        verboseMessage(`Importing internal role with name "${options.name}"`);
      } else {
        verboseMessage('Importing all internal roles');
      }
      const outcome = await configManagerImportInternalRoles(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
