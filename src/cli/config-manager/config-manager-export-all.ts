import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';
import { configManagerExportAllWithConfigFolder } from '../../configManagerOps/FrConfigAllOps'
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
    .addOption(
      new Option(
        '-F, --config-folder <config-folder-path>',
        'Directory path of the folder that contains config files. \n' +
        'The config file name should be equal to: command-name.json. \n' +
        'For example, the config file of authz-policies should be authz-policies.json in the folder.' + 
        'IF you need a template for the config file of each command, \n ' +
        'please refer to the help message by typing frodo config-manager export <entity-name> -h'
      )
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

      if (options.configFolder && await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Exporting config files that fr-config-manager supports.');
        const outcome = await configManagerExportAllWithConfigFolder({configFolder: options.configFolder});
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
