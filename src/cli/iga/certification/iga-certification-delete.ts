import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  deleteCertification,
  deleteCertifications,
} from '../../../ops/cloud/iga/IgaCertificationOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga certification delete');

  program
    .description('Delete certifications.')
    .addOption(
      new Option(
        '-i, --certification-id <certification-id>',
        'Certification id. If specified, -n or -a cannot be used.'
      ).conflicts(['certificationName', 'all'])
    )
    .addOption(
      new Option(
        '-n, --certification-name <certification-name>',
        'Certification name. Cannot be used with -i, or -a.'
      ).conflicts(['certificationId', 'all'])
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all certifications. Cannot be used with -i or -n'
      ).conflicts(['certificationId', 'certificationName'])
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
        if (
          !options.certificationId &&
          !options.certificationName &&
          !options.all
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);

        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }

        let outcome;

        // delete by id
        if (options.certificationId || options.certificationName) {
          verboseMessage('Deleting certification...');
          outcome = await deleteCertification(
            options.certificationId,
            options.certificationName
          );
          if (!outcome) process.exitCode = 1;
        }

        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all certifications...');
          outcome = await deleteCertifications();
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
