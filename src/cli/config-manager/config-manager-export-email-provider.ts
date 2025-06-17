<<<<<<< HEAD
import { configManagerExportEmailProviderConfiguration } from '../../configManagerOps/FrConfigEmailProviderOps';
=======
import { exportEmailProviderConfiguration } from '../../configManagerOps/FrConfigEmailProviderOps';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export email-provider',
    [],
    deploymentTypes
  );

  program
    .description('Export email provider configuration.')
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
        verboseMessage('Exporting email provider configuration');
<<<<<<< HEAD
        const outcome = await configManagerExportEmailProviderConfiguration();
=======
        const outcome = await exportEmailProviderConfiguration();
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
