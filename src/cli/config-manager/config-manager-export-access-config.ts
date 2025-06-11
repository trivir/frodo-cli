import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';
import { configManagerExportAccessConfig } from '../../configManagerOps/FrConfigAccessConfigOps';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export access-config',
    [],
    deploymentTypes
  );

  program
    .description('Export access-config objects.')
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
        verboseMessage('Exporting config entity access-config');
        const outcome = await configManagerExportAccessConfig(options.envFile);
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
