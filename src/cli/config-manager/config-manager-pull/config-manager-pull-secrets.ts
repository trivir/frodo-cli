import { frodo } from '@rockcarver/frodo-lib';

import { configManagerExportSecrets } from '../../../configManagerOps/FrConfigSecretOps';
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
    'frodo config-manager pull secrets',
    [],
    deploymentTypes
  );

  program
    .description('Export secrets.')
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
        verboseMessage('Exporting secrets');
        const outcome = await configManagerExportSecrets(options);
        if (!outcome) process.exitCode = 1;
      } else {
        process.exitCode = 1;
      }
    });

  return program;
}
