import { frodo } from '@rockcarver/frodo-lib';

import { configManagerRestart } from '../../../configManagerOps/FRConfigRestart';
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
    'frodo config-manager push restart',
    [],
    deploymentTypes
  );
  program
    .description('Restart the environment.')
    .addOption(
      program.createOption('-s, --status', 'Check restart status only.')
    )
    .addOption(
      program.createOption('-c, --check', 'Only restart if ESVs need loading.')
    )
    .addOption(
      program.createOption('-w, --wait', 'Wait for restart to complete.')
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
        verboseMessage('Restarting Tenant');
        const outcome = await configManagerRestart(
          options.check,
          options.status,
          options.wait
        );
        if (!outcome) process.exitCode = 1;
      }
      // unrecognized combination of options or no options
      else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );

        process.exitCode = 1;
        program.help();
      }
    });
  return program;
}
