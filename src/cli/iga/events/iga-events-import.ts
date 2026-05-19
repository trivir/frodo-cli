import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importFirstEventFromFile,
  importEventFromFile,
  importEventsFromFile,
  importEventsFromFiles,
} from '../../../ops/cloud/iga/IgaEventsOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga events import',
    [],
    deploymentTypes
  );

  program
    .description('Import events.')
    .addOption(
      new Option(
        '-i, --event-id <event-id>',
        'event id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all events from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all events from separate files (*.event.json) in the current directory. Ignored with -i or -a.'
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
        const isImportById = options.eventId && options.file;
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
          process.exitCode = 1;
          program.help();
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
          process.exit(1);
        }
        // import by id
        if (isImportById) {
          verboseMessage(`Importing event "${options.eventId}"...`);
          const outcome = await importEventFromFile(
            options.eventId,
            options.file,
            {
              deps: options.deps,
            }
          );
          if (!outcome) process.exit(1);
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all events from a single file (${options.file})...`
          );
          const outcome = await importEventsFromFile(options.file, {
            deps: options.deps,
          });
          if (!outcome) process.exit(1);
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all events from separate files (*.event.json) in current directory...'
          );
          const outcome = await importEventsFromFiles({
            deps: options.deps,
          });
          if (!outcome) process.exit(1);
        }
        // import first event from file
        else if (isImportFirst) {
          verboseMessage(
            `Importing first event from file "${options.file}"...`
          );
          const outcome = await importFirstEventFromFile(options.file, {
            deps: options.deps,
          });
          if (!outcome) process.exit(1);
        }
      }
      // end program logic inside action handler
    );

  return program;
}
