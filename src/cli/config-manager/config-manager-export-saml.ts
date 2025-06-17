import { Option } from 'commander';

import { configManagerExportSaml } from '../../configManagerOps/FrConfigSamlOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export saml',
    [],
    deploymentTypes
  );

  program
    .description('Export saml.')
    .addOption(
      new Option('-f, --file <file>', 'The file path of the SAML config file. ')
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
      if (options.realm) {
        realm = options.realm;
      }

      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Exporting config entity saml');
        const outcome = await configManagerExportSaml(options.file);
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
