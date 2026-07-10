import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportMappings } from '../../../configManagerOps/FrConfigConnectorMappingOps';
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
    'frodo config-manager pull connector-mappings',
    [],
    deploymentTypes
  );

  program
    .description('Export connector mappings.')
    .addOption(
      new Option('-n, --name <name>', 'Export by name of connector mapping.')
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
          verboseMessage(`Exporting ${options.name}`);
          outcome = await configManagerExportMappings(options.name);
        } else {
          verboseMessage('Exporting connector mappings');
          outcome = await configManagerExportMappings();
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
