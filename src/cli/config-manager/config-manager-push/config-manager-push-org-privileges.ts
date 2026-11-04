import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import {
  configManagerImportOrgPrivileges
} from '../../../configManagerOps/FrConfigOrgPrivilegesOps';
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
    'frodo config-manager push org-privileges',
    [],
    deploymentTypes
  );

  program
    .description('Import organization privileges config.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Organization Privileges name; only imports the privileges with the specified name.'
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

      printMessage(
        `Importing organization privileges config for ${options.name || 'all realms'}`
      );
      const outcome = await configManagerImportOrgPrivileges(options.name);
      if (!outcome) process.exitCode = 1;
  });

  return program;
}
