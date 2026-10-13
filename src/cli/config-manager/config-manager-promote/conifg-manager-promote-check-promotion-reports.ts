import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import { configManagerCheckPromotionReports } from '../../../configManagerOps/FrConfigPromoteOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager promote check-promotion-reports',
    [],
    deploymentTypes
  );

  program
    .description(
      'Retrieve promotion reports. Defaults to the latest report if no option is specified.'
    )
    .addOption(new Option('-l, --list', 'List all promotion reports.'))
    .addOption(
      new Option('-r, --reportID <id>', 'Retrieve a promotion report by ID.')
    )
    .addOption(
      new Option(
        '-x, --provisional',
        'Retrieve a provisional promotion report.'
      )
    )
    .addOption(
      new Option(
        '-y, --provisional-rollback',
        'Retrieve a provisional rollback report.'
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
        const outcome = await configManagerCheckPromotionReports(
          options.list,
          options.reportID,
          options.provisional,
          options.provisionalRollback
        );

        if (!outcome) process.exitCode = 1;
      } else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        process.exitCode = 1;
        program.help();
      }
    });

  return program;
}
