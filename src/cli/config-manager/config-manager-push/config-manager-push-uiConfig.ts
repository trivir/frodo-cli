import { configManagerImportUiConfig } from '../../../configManagerOps/FrConfigUiConfigOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';
import { Option } from 'commander';


const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push ui-config',
    [],
    deploymentTypes
  );

  program
    .description('Import ui-configuration objects.')
    .addOption(new Option('-f, --file [file]', 'Fr-config-manager format file to import.'))
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
        verboseMessage('Exporting config entity ui-configuration');
        const outcome = await configManagerImportUiConfig(options.file);
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