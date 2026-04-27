import { frodo } from '@rockcarver/frodo-lib';

import { configManagerExportRemoteServers } from '../../../configManagerOps/FrConfigRemoteServersOps';
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
    'frodo config-manager pull remote-servers',
    [],
    deploymentTypes
  );

  program
    .description('Export remote-servers objects.')
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
      verboseMessage('Exporting config entity remote-servers');
      const outcome = await configManagerExportRemoteServers(options.envFile);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
