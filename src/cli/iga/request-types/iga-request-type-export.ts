import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportAllRequestTypesToFiles,
  exportAllRequestTypeToFile,
  exportRequestTypeToFile,
} from '../../../ops/cloud/iga/IgaRequestTypesOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga request-type export',
    [],
    deploymentTypes
  );

  program
    .description('Export request-type.')
    .addOption(
      new Option(
        '-n, --request-type-name <request-type-name>',
        'Request type name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <request-type-id>.request-type.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all request types to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all request types as separate files <request-type-id>.request-type.json. Ignored with -i, and -a.'
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
    .addOption(
      new Option(
        '-R, --read-only',
        'Export non-mutable request-types in addition to the mutable request-types.'
      )
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not include any dependencies (email templates, request types, events, etc.).'
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
        if (!options.requestTypeName && !options.all && !options.allSeparate) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exit(1);
          return;
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) {
          printMessage('Error getting tokens', 'error');
          process.exit(1);
          return;
        }
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
          return;
        }
        // --request-type-name --n
        if (options.requestTypeName) {
          verboseMessage(`Exporting request "${options.requestTypeName}"...`);
          const outcome = await exportRequestTypeToFile(
            undefined,
            options.requestTypeName,
            options.file,
            options.metadata,
            options.modifiedProperties,
            options.extract
          );
          if (!outcome) process.exit(1);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all request types to a single file...');
          const outcome = await exportAllRequestTypeToFile(
            options.file,
            options.metadata,
            options.modifiedProperties
          );
          if (!outcome) process.exit(1);
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all request types to separate files...');
          const outcome = await exportAllRequestTypesToFiles(
            options.metadata,
            options.modifiedProperties,
            options.extract,
            {
              onlyCustom: options.deps,
              useStringArrays: options.useStringArrays,
            }
          );
          if (!outcome) process.exit(1);
        }
      }
      // end command logic inside action handler
    );

  return program;
}
