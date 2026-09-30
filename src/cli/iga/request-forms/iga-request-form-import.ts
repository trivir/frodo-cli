import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importFirstRequestFormFromFile,
  importRequestFormFromFile,
  importRequestFormsFromFile,
  importRequestFormsFromFiles,
} from '../../../ops/cloud/iga/IgaRequestFormsOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga request-form import',
    [],
    deploymentTypes
  );

  program
    .description('Import request forms.')
    .addOption(
      new Option(
        '-n, --request-form-name <request-form-name>',
        'Request for name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all request forms from single file. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all request forms from separate files (*.requestforms.json) in the current directory. Ignored with -n or -a.'
      )
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not import any dependencies (email templates, request forms, events, etc.).'
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
        const isImportById = options.requestFormName && options.file;
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
          verboseMessage(
            `Importing request forms "${options.requestFormName}"...`
          );
          const outcome = await importRequestFormFromFile(
            options.requestFormName,
            options.file,
            {
              deps: options.deps,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all request form from a single file (${options.file})...`
          );
          const outcome = await importRequestFormsFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all request forms from separate files (*.requestform.json) in current directory...'
          );
          const outcome = await importRequestFormsFromFiles();
          if (!outcome) process.exitCode = 1;
        }
        // import first request form from file
        else if (isImportFirst) {
          verboseMessage(
            `Importing first request form from file "${options.file}"...`
          );
          const outcome = await importFirstRequestFormFromFile(options.file, {
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
