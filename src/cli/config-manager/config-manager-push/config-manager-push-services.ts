import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportServices } from '../../../configManagerOps/FrConfigServiceOps';
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
    'frodo config-manager push services',
    [],
    deploymentTypes
  );

  program
    .addOption(
      new Option('-n, --name <name>', 'Name of the service to import.')
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
      verboseMessage('Importing email provider configuration.');
      const outcome = await configManagerImportServices(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
