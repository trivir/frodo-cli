import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportScopesToFile,
  exportScopesToFiles,
  exportScopeToFile,
} from '../../../ops/cloud/iga/IgaScopeOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga scope export',
    [],
    deploymentTypes
  );

  program
    .description('Export scopes.')
    .addOption(
      new Option(
        '-n, --scope-name <scope-name>',
        'Scope name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <scope-name>.scope.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all scopes to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all scopes as separate files <scope-name>.scope.json. Ignored with -i, and -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Do not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '-M, --modified-properties',
        'Include modified properties in export (e.g. lastModifiedDate, lastModifiedBy, createdBy, creationDate, etc.)'
      ).default(false, 'false')
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
        if (!options.scopeName && !options.all && !options.allSeparate) {
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
        // --scopeName -i
        if (options.scopeName) {
          verboseMessage(`Exporting scope "${options.scopeName}"...`);
          const outcome = await exportScopeToFile(
            options.scopeName,
            options.file,
            options.metadata,
            options.modifiedProperties
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all scopes to a single file...');
          const outcome = await exportScopesToFile(
            options.file,
            options.metadata,
            options.modifiedProperties
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all scopes to separate files...');
          const outcome = await exportScopesToFiles(
            options.metadata,
            options.modifiedProperties
          );
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
