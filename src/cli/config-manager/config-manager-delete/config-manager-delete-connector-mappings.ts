import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteMappings } from '../../../configManagerOps/FrConfigConnectorMappingOps';
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
    'frodo config-manager delete connector-mappings',
    [],
    deploymentTypes
  );

  program
    .description('Delete connector mappings.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Specifies the name to delete from the connector mapping.'
      )
    )
    .addOption(
      new Option(
        '-d, --dry-run',
        'Show which connector mappings to delete first.'
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

      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Deleting connector mappings');
        const outcome = await configManagerDeleteMappings(options.name, options.dryRun);
        if (!outcome) process.exitCode = 1;
      }
    });

  return program;
}
