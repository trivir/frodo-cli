import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportJourneys } from '../../../configManagerOps/FrConfigJourneysOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push journeys',
    [],
    deploymentTypes
  );

  program
    .description('Import journeys.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Journey name, imports the specified Journey.'
      )
    )
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Imports the journeys to the specified realm'
      )
    )
    .addOption(new Option('-d, --push-dependencies', 'Push dependencies.'))
    // TO DO: implementing for 'check'
    // .addOption(
    //   new Option('-c, --check Check first if ESVs changed')
    // )
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
        verboseMessage('Importing config entity journeys');
        const outcome = await configManagerImportJourneys(
          options.name,
          options.realm,
          options.pushDependencies
        );
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
