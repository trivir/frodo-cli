import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportAllRequestFormsToFile,
  exportAllRequestFormsToFiles,
  exportRequestFormToFile,
} from '../../../ops/cloud/iga/IgaRequestFormsOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga request form export',
    [],
    deploymentTypes
  );

  program
    .description('Export request forms.')
    .addOption(
      new Option(
        '-n, --request-form-name <request-form-name>',
        'request form name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <requestForm-name>.request-form.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all request forms to a single file. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all request form as separate files <RequestForm-name>.request-form.json. Ignored with -n, and -a.'
      )
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not include any dependencies (email templates, request forms, events, etc.).'
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
    .addOption(
      new Option(
        '-x, --no-extract',
        'Do not extract the scripts from the exported file and save them to separate files. Ignored with -a.'
      ).default(true, 'true')
    )
    .addOption(
      new Option(
        '--use-string-arrays',
        'Where applicable, use string arrays to store scripts.'
      ).default(false, 'off')
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
        if (!options.requestFormName && !options.all && !options.allSeparate) {
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
        // --request-form-name -n
        if (options.requestFormName) {
          verboseMessage(
            `Exporting request form "${options.requestFormName}"...`
          );
          const outcome = await exportRequestFormToFile(
            undefined,
            options.requestFormName,
            options.file,
            options.metadata,
            options.modifiedProperties,
            options.extract,
            {
              deps: options.deps,
              useStringArrays: options.useStringArrays,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all request forms to a single file...');
          const outcome = await exportAllRequestFormsToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            options.extract,
            {
              deps: options.deps,
              useStringArrays: options.useStringArrays,
            }
          );

          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all request forms to separate files...');
          const outcome = await exportAllRequestFormsToFiles(
            options.metadata,
            options.modifiedProperties,
            options.extract,
            {
              deps: options.deps,
              useStringArrays: options.useStringArrays,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
