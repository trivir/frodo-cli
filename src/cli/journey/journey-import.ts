import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importFirstJourneyFromFile,
  importJourneyFromFile,
  importJourneysFromFile,
  importJourneysFromFiles,
} from '../../ops/JourneyOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo journey import');

  program
    .description('Import journey/tree.')
    .addOption(
      new Option(
        '-i, --journey-id <journey>',
        'Name of a journey/tree. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the file to import the journey(s) from. Ignored with -A.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Import all the journeys/trees from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all the journeys/trees from separate files (*.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '--re-uuid',
        'Generate new UUIDs for all nodes during import.'
      ).default(false, 'off')
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not include any dependencies (scripts, email templates, SAML entity providers and circles of trust, social identity providers, themes).'
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
        if (
          !options.journeyId &&
          !options.all &&
          !options.file &&
          !options.allSeparate
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        // import
        if (options.journeyId) {
          printMessage(`Importing journey ${options.journeyId}...`);
          const outcome = await importJourneyFromFile(
            options.journeyId,
            options.file,
            {
              reUuid: options.reUuid,
              deps: options.deps,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all && options.file) {
          printMessage(
            `Importing all journeys from a single file (${options.file})...`
          );
          const outcome = await importJourneysFromFile(options.file, {
            reUuid: options.reUuid,
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate && !options.file) {
          printMessage(
            'Importing all journeys from separate files in current directory...'
          );
          const outcome = await importJourneysFromFiles({
            reUuid: options.reUuid,
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
        // import first journey in file
        else if (options.file) {
          printMessage('Importing first journey in file...');
          const outcome = await importFirstJourneyFromFile(options.file, {
            reUuid: options.reUuid,
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
