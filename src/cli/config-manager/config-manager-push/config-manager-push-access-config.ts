import { frodo } from '@rockcarver/frodo-lib';

import { configManagerImportAccessConfig } from '../../../configManagerOps/FrConfigAccessConfigOps';
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
    'frodo config-manager push access-config',
    [],
    deploymentTypes
  );

  program
    .description('Import access configuration.')
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

      verboseMessage('Importing access configuration...');
      const outcome = await configManagerImportAccessConfig();
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
