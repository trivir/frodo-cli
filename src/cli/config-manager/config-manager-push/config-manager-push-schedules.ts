import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportSchedules } from '../../../configManagerOps/FrConfigSchedulesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push schedules',
    [],
    deploymentTypes
  );

  program
    .description('Import schedules.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Schedule name; import only the specified schedule name'
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
        if (options.name) {
          verboseMessage(`Importing schedule with name "${options.name}"`);
        } else {
          verboseMessage('Importing all schedules');
        }
        const outcome = await configManagerImportSchedules(options.name);
        if (!outcome) process.exitCode = 1;
      } else {
        process.exitCode = 1;
      }
    });

  return program;
}
