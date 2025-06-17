<<<<<<< HEAD
<<<<<<<< HEAD:src/cli/config-manager/config-manager-export-cors.ts
import { configManagerExportCors } from '../../configManagerOps/FrConfigCorsOps';
========
import { exportAllMappings } from '../../configManagerOps/FrConfigConnectorMappingOps';
>>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd:src/cli/config-manager/config-manager-export-connector-mappings.ts
=======
import { exportCorsConfiguration } from '../../configManagerOps/FrConfigCorsOps';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud'];

export default function setup() {
  const program = new FrodoCommand(
<<<<<<< HEAD
<<<<<<<< HEAD:src/cli/config-manager/config-manager-export-cors.ts
    'frodo config-manager export cors',
========
    'frodo config-manager export connector-mappings',
>>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd:src/cli/config-manager/config-manager-export-connector-mappings.ts
=======
    'frodo config-manager export cors',
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
    [],
    deploymentTypes
  );

  program
<<<<<<< HEAD
<<<<<<<< HEAD:src/cli/config-manager/config-manager-export-cors.ts
    .description('Export CORS configuration.')
========
    .description('Get connector mappings.')
>>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd:src/cli/config-manager/config-manager-export-connector-mappings.ts
=======
    .description('Export CORS configuration.')
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
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
<<<<<<< HEAD
<<<<<<<< HEAD:src/cli/config-manager/config-manager-export-cors.ts
        verboseMessage('Exporting CORS configuration');
        const outcome = await configManagerExportCors();
========
        verboseMessage('Exporting connector mappings');
        const outcome = await exportAllMappings();
>>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd:src/cli/config-manager/config-manager-export-connector-mappings.ts
=======
        verboseMessage('Exporting CORS configuration');
        const outcome = await exportCorsConfiguration();
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
