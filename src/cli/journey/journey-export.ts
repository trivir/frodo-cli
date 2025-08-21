import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportJourneyCoords,
  exportJourneysToFile,
  exportJourneysToFiles,
  exportJourneyToFile,
} from '../../ops/JourneyOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo journey export');

  program
    .description('Export journeys/trees.')
    .addOption(
      new Option(
        '-i, --journey-id <journey>',
        'Name of a journey/tree. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the file to write the exported journey(s) to. Ignored with -A.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all the journeys/trees in a realm. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all the journeys/trees in a realm as separate files <journey/tree name>.json. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Does not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '--use-string-arrays',
        'Where applicable, use string arrays to store multi-line text (e.g. scripts).'
      ).default(false, 'off')
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not include any dependencies (scripts, email templates, SAML entity providers and circles of trust, social identity providers, themes).'
      )
    )
    .addOption(
      new Option(
        '--no-coords',
        'Do not include the x and y coordinate positions of the journey/tree nodes.'
      )
    )
    .addOption(
      new Option(
        '--sep-coords',
        'Export x and y coordinate positions of the journey/tree nodes to separate files.'
      ).default(false)
    )
    // .addOption(
    //   new Option(
    //     '-O, --organize <method>',
    //     'Organize exports into folders using the indicated method. Valid values for method:\n' +
    //       'id: folders named by id of exported object\n' +
    //       'type: folders named by type (e.g. script, journey, idp)\n' +
    //       'type/id: folders named by type with sub-folders named by id'
    //   )
    // )
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
        if (!(await getTokens())) {
          printMessage('Authentication failed.', 'error');
          process.exitCode = 1;
          return;
        }
        let outcome = false;
        // export
        if (options.journeyId) {
          verboseMessage('Exporting journey...');
          outcome = await exportJourneyToFile(
            options.journeyId,
            options.file,
            options.metadata,
            {
              useStringArrays: options.useStringArrays,
              deps: options.deps,
              coords: !options.sepCoords,
            }
          );
          if (outcome && options.sepCoords) {
            verboseMessage('Exporting journey coordinates separately...');
            await exportJourneyCoords([options.journeyId], {
              deps: options.journeyId,
              useStringArrays: options.useStringArrays,
              coords: true,
              sepCoords: true,
            });
          }
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all journeys to a single file...');
          outcome = await exportJourneysToFile(options.file, options.metadata, {
            useStringArrays: options.useStringArrays,
            deps: options.deps,
            coords: !options.sepCoords,
          });
          if (outcome && options.sepCoords) {
            verboseMessage(
              'Exporting coordinates of all journeys to a separate file...'
            );
            await exportJourneyCoords(
              'all',
              {
                deps: options.deps,
                useStringArrays: options.useStringArrays,
                coords: true,
              },
              'all'
            );
          }
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all journeys to separate files...');
          outcome = await exportJourneysToFiles(options.metadata, {
            useStringArrays: options.useStringArrays,
            deps: options.deps,
            coords: !options.sepCoords,
          });
          if (outcome && options.sepCoords) {
            verboseMessage(
              'Exporting coordinates of all journeys to separate files...'
            );
            await exportJourneyCoords(
              'all',
              {
                deps: options.deps,
                useStringArrays: options.useStringArrays,
                coords: true,
              },
              'allSeparate'
            );
          }
        }
        // unrecognized combination of options or no options
        else {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exitCode = 1;
          return;
        }

        if (!outcome) process.exitCode = 1;
      }
    );
  return program;
}
