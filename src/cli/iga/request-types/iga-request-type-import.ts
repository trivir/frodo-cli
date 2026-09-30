import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importFirstRequestTypeFromFile,
  importRequestTypeFromFile,
  importRequestTypesFromFile,
  importRequestTypesFromFiles,
} from '../../../ops/cloud/iga/IgaRequestTypesOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga request-type import',
    [],
    deploymentTypes
  );

  program
    .description('Import request-type.')
    .addOption(
      new Option(
        '-n, --request-type-name <request-type-name>',
        'Request type name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))

    .addOption(
      new Option(
        '-a, --all',
        'Import all request-types from single file. Ignored with -f.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all request-types from separate files (*.requestType.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not import any dependencies (email templates, request types, events, etc.).'
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
        const isImportByName = options.requestTypeName && options.file;
        const isImportAll = options.all && options.file;
        const isImportAllSeparate = options.allSeparate && !options.file;
        const isImportFirst = !!options.file;
        if (
          !isImportByName &&
          !isImportAll &&
          !isImportAllSeparate &&
          !isImportFirst
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exit(1);
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) {
          printMessage('Error getting tokens', 'error');
          process.exit(1);
        }
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }
        // import by id
        if (isImportByName) {
          verboseMessage(
            `Importing request type "${options.requestTypeNamed}"...`
          );
          const outcome = await importRequestTypeFromFile(
            options.requestTypeName,
            options.file,
            {
              onlyCustom: options.deps,
            }
          );
          if (!outcome) process.exit(1);
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all request types from a single file (${options.file})...`
          );
          const outcome = await importRequestTypesFromFile(options.file);
          if (!outcome) process.exit(1);
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all request types from separate files (*.requestType.json) in current directory...'
          );
          const outcome = await importRequestTypesFromFiles();
          if (!outcome) process.exit(1);
        }
        // import first workflow from file
        else if (isImportFirst) {
          verboseMessage(
            `Importing first request type from file "${options.file}"...`
          );
          const outcome = await importFirstRequestTypeFromFile(options.file);
          if (!outcome) process.exit(1);
        }
      }
      // end program logic inside action handler
    );

  return program;
}
