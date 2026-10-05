import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  configManagerDeleteConnectorDefinition,
  configManagerDeleteConnectorDefinitionsAll,
} from '../../../configManagerOps/FrConfigConnectorDefinitionsOps';
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
    'frodo config-manager delete connector-definitions',
    [],
    deploymentTypes
  );

  program
    .description('Delete connector definitions.')
    .addOption(
      new Option(
        '-n, --name <connector-name>',
        'Get connector-definition from specified name/id, without the type prefix.'
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
          `Deleting connector definition for connector: "${options.name}"`
        );
        outcome = await configManagerDeleteConnectorDefinition({
          connectorName: options.name,
        });
      } else {
        printMessage('Deleting all connector definitions.');
        outcome = await configManagerDeleteConnectorDefinitionsAll();
      }
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
