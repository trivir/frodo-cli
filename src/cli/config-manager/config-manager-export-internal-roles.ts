import { Option } from 'commander';

<<<<<<< HEAD
import { configManagerExportInternalRoles } from '../../configManagerOps/FrConfigInternalRolesOps';
=======
import { configManagerExportRoles } from '../../configManagerOps/FrConfigInternalRolesOps';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export internal-roles',
    [],
    deploymentTypes
  );

  program

    .description('Export internal roles in fr-config-manager style.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Internal role name, It only export the endpoint with the name'
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

      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Exporting internal roles');
        const outcome = await configManagerExportInternalRoles(options.name);
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
