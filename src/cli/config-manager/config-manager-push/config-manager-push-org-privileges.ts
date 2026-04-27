import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  configManagerImportOrgPrivilegesAllRealms,
  configManagerImportOrgPrivilegesByName,
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
      let outcome: boolean;
      if (options.name) {
        printMessage(
          `Importing organization privileges config for "${options.name}"`
        );
        outcome = await configManagerImportOrgPrivilegesByName(options.name);
      } else {
        printMessage('Importing organization privileges config to all realms');
        outcome = await configManagerImportOrgPrivilegesAllRealms();
      }
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
