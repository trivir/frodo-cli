import { frodo } from '@rockcarver/frodo-lib';

import { configManagerExportTermsAndConditions } from '../../../configManagerOps/FrConfigTermsAndConditionsOps';
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
    'frodo config-manager pull terms-and-conditions',
    [],
    deploymentTypes
  );

  program
    .description('Export terms and conditions.')
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
      verboseMessage('Exporting terms and conditions');
      const outcome = await configManagerExportTermsAndConditions();
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
