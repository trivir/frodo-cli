import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importAdminFederationProviderFromFile,
  importAdminFederationProvidersFromFile,
  importAdminFederationProvidersFromFiles,
  importFirstAdminFederationProviderFromFile,
} from '../../ops/cloud/AdminFederationOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo admin federation import',
    ['realm'],
    deploymentTypes
  );

  program
    .description('Import admin federation providers.')
    .addOption(
      new Option(
        '-i, --idp-id <id>',
        'Provider id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the file to import the provider(s) from.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Import all the providers from single file. Ignored with -t or -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all the providers from separate files (*.admin.federation.json) in the current directory. Ignored with -t or -i or -a.'
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

        if (!options.all && !options.allSeparate && !options.idpId) {
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

        let outcome: boolean;

        // import by id
        if (options.file && options.idpId) {
          verboseMessage(`Importing provider "${options.idpId}"...`);
          outcome = await importAdminFederationProviderFromFile(
            options.idpId,
            options.file
          );
        }
        // --all -a
        else if (options.all && options.file) {
          verboseMessage(
            `Importing all providers from a single file (${options.file})...`
          );
          outcome = await importAdminFederationProvidersFromFile(options.file);
        }
        // --all-separate -A
        else if (options.allSeparate && !options.file) {
          verboseMessage(
            'Importing all providers from separate files in current directory...'
          );
          outcome = await importAdminFederationProvidersFromFiles();
        }
        // import first provider from file
        else if (options.file) {
          verboseMessage(
            `Importing first provider from file "${options.file}"...`
          );
          outcome = await importFirstAdminFederationProviderFromFile(
            options.file
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
