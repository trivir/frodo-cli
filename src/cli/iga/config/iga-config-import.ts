import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importConfigFromFile,
  importConfigurationsFromFile,
  importConfigurationsFromFiles,
  importFirstConfigFromFile,
} from '../../../ops/cloud/iga/IgaConfigOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga config import',
    [],
    deploymentTypes
  );

  program
    .description('Import iga config.')
    .addOption(
      new Option(
        '-n, --config-key <wconfig-key>',
        'Config key. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all iga config from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'import all iga config as separate files <config-key>.config.json. Ignored with -n, and -a.'
      )
    )

    .action(
      // implement program logic inside action handler
      async (host, realm, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );
        const isImportById = options.configKey && options.file;
        const isImportAll = options.all && options.file;
        const isImportAllSeparate = options.allSeparate && !options.file;
        const isImportFirst = !!options.file;
        if (
          !isImportById &&
          !isImportAll &&
          !isImportAllSeparate &&
          !isImportFirst
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exitCode = 1;
          return;
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) {
          printMessage('Error getting tokens', 'error');
          process.exitCode = 1;
          return;
        }
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exitCode = 1;
          return;
        }
        // import by id
        if (isImportById) {
          verboseMessage(`Importing iga config "${options.configKey}"...`);
          const outcome = await importConfigFromFile(
            options.configKey,
            options.file
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all iga config from a single file (${options.file})...`
          );
          const outcome = await importConfigurationsFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Importing all iga config to separate files...');
          const outcome = await importConfigurationsFromFiles();
          if (!outcome) process.exitCode = 1;
        }
        // import first iga config from file
        else if (isImportFirst) {
          verboseMessage(
            `Importing first iga config from file "${options.file}"...`
          );
          const outcome = await importFirstConfigFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
