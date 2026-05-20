import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportScriptByNameToFile,
  exportScriptsToFile,
  exportScriptsToFiles,
  exportScriptToFile,
} from '../../ops/ScriptOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo script export');

  program
    .description('Export scripts.')
    .addOption(
      new Option(
        '-i, --script-id <uuid>',
        'Uuid of the script. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-n, --script-name <name>',
        'Name of the script. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Export all scripts to a single file. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all scripts to separate files (*.script.json) in the current directory. Ignored with -n or -a.'
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
        '-M, --modified-properties',
        'Include modified properties in export (e.g. lastModifiedDate, lastModifiedBy, createdBy, creationDate, etc.)'
      ).default(false, 'false')
    )
    // deprecated option
    .addOption(
      new Option(
        '-s, --script <script>',
        'DEPRECATED! Use -n/--script-name instead. Name of the script.'
      )
    )
    .addOption(
      new Option(
        '-x, --no-extract',
        'Do not extract the script from the exported file to a separate file.'
      ).default(true, 'true')
    )
    .addOption(
      new Option(
        '-d, --default',
        'Export all scripts including the default scripts. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not include script dependencies (i.e. library scripts). Ignored with -a and -A.'
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
          !options.scriptId &&
          !options.scriptName &&
          !options.all &&
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

        // export by id
        if (options.scriptId) {
          verboseMessage('Exporting script...');
          const outcome = await exportScriptToFile(
            options.scriptId,
            options.file,
            options.metadata,
            options.modifiedProperties,
            options.extract,
            {
              deps: options.deps,
              includeDefault: options.default,
              useStringArrays: true,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // export by name
        else if (options.scriptName || options.script) {
          verboseMessage('Exporting script...');
          const outcome = await exportScriptByNameToFile(
            options.scriptName || options.script,
            options.file,
            options.metadata,
            options.modifiedProperties,
            options.extract,
            {
              deps: options.deps,
              includeDefault: options.default,
              useStringArrays: true,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // -a / --all
        else if (options.all) {
          verboseMessage('Exporting all scripts to a single file...');
          const outcome = await exportScriptsToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              includeDefault: options.default,
              useStringArrays: true,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // -A / --all-separate
        else if (options.allSeparate) {
          verboseMessage('Exporting all scripts to separate files...');
          const outcome = await exportScriptsToFiles(
            options.extract,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              includeDefault: options.default,
              useStringArrays: true,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
