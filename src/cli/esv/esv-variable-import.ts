import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo esv variable import');

  program
    .description('Import variables.')
    .addOption(
      new Option(
        '-i, --variable-id <variable-id>',
        'Variable id. If specified, only one variable is imported and the options -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the file to import.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all variables from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all variables from separate files (*.variable.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .action(
      // implement command logic inside action handler
      async (host, realm, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );
        // require cloud deployment type
        if (
          !(await getTokens()) ||
          !assertDeploymentType(CLOUD_DEPLOYMENT_TYPE_KEY)
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        // code goes here
      }
      // end command logic inside action handler
    );

  return program;
}
