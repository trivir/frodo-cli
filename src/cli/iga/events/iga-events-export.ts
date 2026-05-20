import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportEventsToFile,
  exportEventsToFiles,
  exportEventToFile,
} from '../../../ops/cloud/iga/IgaEventsOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga events export',
    [],
    deploymentTypes
  );

  program
    .description('Export events.')
    .addOption(
      new Option(
        '-i, --event-id <event-id>',
        'event id. If specified, -a and -A cannot be used.'
      ).conflicts(['all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Cannot be used with -A. Defaults to <event-id>.event.json.'
      ).conflicts(['allSeparate'])
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all events to a single file. Cannot be used with -i.'
      ).conflicts(['eventId'])
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all events as separate files <event-id>.event.json. Cannot be used with -i and -a.'
      ).conflicts(['eventId', 'all'])
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
        'Do not extract the scripts from the exported file and save them to separate files. Cannot be used with -a.'
      ).default(true, 'true').conflicts(['all'])
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not include any dependencies (email templates, request forms, events, etc.).'
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
        if (!options.eventId && !options.all && !options.allSeparate) {
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
        if (!getTokensIsSuccessful) process.exit(1);
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exitCode = 1;
          return;
        }
        // --event-id -i
        if (options.eventId) {
          verboseMessage(`Exporting event "${options.eventId}"...`);
          const outcome = await exportEventToFile(
            options.eventId,
            options.file,
            options.metadata,
            options.modifiedProperties,
            options.extract,
            { deps: options.deps }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all events to a single file...');
          const outcome = await exportEventsToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            { deps: options.deps }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all events to separate files...');
          const outcome = await exportEventsToFiles(
            options.metadata,
            options.modifiedProperties,
            options.extract,
            { deps: options.deps }
          );
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
