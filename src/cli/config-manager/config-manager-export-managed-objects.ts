import { Option } from 'commander';

<<<<<<< HEAD
import { configManagerExportManagedObjects } from '../../configManagerOps/FrConfigManagedObjectsOps';
=======
import { configManagerExportObjects } from '../../configManagerOps/FrConfigManagedObjectsOps';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export managed-objects',
    [],
    deploymentTypes
  );

  program
    .description('Export managed-objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Endpoint name, It only export the endpoint with the name'
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
        verboseMessage('Exporting config entity managed-objects');
<<<<<<< HEAD
        const outcome = await configManagerExportManagedObjects(options.name);
=======
        const outcome = await configManagerExportObjects(options.name);
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
