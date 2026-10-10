import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importFirstScopeFromFile,
  importScopeFromFile,
  importScopesFromFile,
  importScopesFromFiles,
} from '../../../ops/cloud/iga/IgaScopeOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga scope import',
    [],
    deploymentTypes
  );

  program
    .description('Import scopes.')
    .addOption(
      new Option(
        '-n, --scope-name <scope-name>',
        'Scope id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all scopes from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all scopes from separate files (*.scope.json) in the current directory. Ignored with -i or -a.'
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
        const isImportById = options.scopeName && options.file;
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
          verboseMessage(`Importing scope "${options.scopeName}"...`);
          const outcome = await importScopeFromFile(
            options.scopeName,
            options.file
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all scopes from a single file (${options.file})...`
          );
          const outcome = await importScopesFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all scopes from separate files (*.scope.json) in current directory...'
          );
          const outcome = await importScopesFromFiles();
          if (!outcome) process.exitCode = 1;
        }
        // import first scope from file
        else if (isImportFirst) {
          verboseMessage(
            `Importing first scope from file "${options.file}"...`
          );
          const outcome = await importFirstScopeFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
