import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportAdminFederationProvidersToFile,
  exportAdminFederationProvidersToFiles,
  exportAdminFederationProviderToFile,
} from '../../ops/cloud/AdminFederationOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo admin federation export',
    ['realm'],
    deploymentTypes
  );

  program
    .description('Export admin federation providers.')
    .addOption(
      new Option(
        '-i, --idp-id <idp-id>',
        'Id/name of a provider. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the file to write the exported provider(s) to. Ignored with -A.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all the providers to a single file. Ignored with -t and -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all the providers as separate files <provider name>.admin.federation.json. Ignored with -t, -i, and -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Does not include metadata in the export file.'
      )
    )
    .action(
      // implement command logic inside action handler
      async (host, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          user,
          password,
          options,
          command
        );

        if (!options.idpId && !options.all && !options.allSeparate) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens(
          true,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);

        let outcome;

        // export by id/name
        if (options.idpId) {
          verboseMessage(`Exporting provider "${options.idpId}...`);
          outcome = await exportAdminFederationProviderToFile(
            options.idpId,
            options.file,
            options.metadata
          );
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all providers to a single file...');
          outcome = await exportAdminFederationProvidersToFile(
            options.file,
            options.metadata
          );
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all providers to separate files...');
          outcome = await exportAdminFederationProvidersToFiles(
            options.metadata
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
