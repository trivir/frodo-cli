import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';
import { configManagerExportAllStatic } from '../../configManagerOps/FrConfigAllOps'
import { Option } from 'commander';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export all',
    [],
    deploymentTypes
  );

  program
    .description('Export audit objects.')
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      if ( await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Exporting config files that fr-config-manager supports.');
        const outcome = await configManagerExportAllStatic();
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
