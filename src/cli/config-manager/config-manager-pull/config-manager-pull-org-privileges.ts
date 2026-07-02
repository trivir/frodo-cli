import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportOrgPrivileges } from '../../../configManagerOps/FrConfigOrgPrivilegesOps';
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
    'frodo config-manager pull org-privileges',
    [],
    deploymentTypes
  );

  program
    .description('Export organization privileges config.')
    .addOption(
      new Option('-n, --name <name>', 'Export by name of org-privilege')
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

      if (await getTokens(false, true, deploymentTypes)) {
        let outcome: boolean;
        if (options.name) {
          printMessage(
            `Exporting ${options.name} organization privilege config`
          );
          outcome = await configManagerExportOrgPrivileges(options.name);
        } else {
          printMessage('Exporting all oranization privileges config');
          outcome = await configManagerExportOrgPrivileges();
        }
        if (!outcome) process.exitCode = 1;
      }
      // unrecognized combination of options or no options
      else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
      }
    });

  return program;
}
