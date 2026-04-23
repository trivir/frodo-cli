import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportPolicySetsToFile,
  exportPolicySetsToFiles,
  exportPolicySetToFile,
} from '../../ops/PolicySetOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz set export');

  program
    .description('Export authorization policy sets.')
    .addOption(
      new Option(
        '-i, --set-id <set-id>',
        'Policy set id/name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Export all applications/policy sets to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all applications/policy sets to separate files (*.authz.json) in the current directory. Ignored with -i or -a.'
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
    .addOption(
      new Option(
        '--no-deps',
        'Do not include any dependencies (policies, scripts).'
      )
    )
    .addOption(
      new Option('--prereqs', 'Include prerequisites (resource types).')
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

        if (!options.setId && !options.all && !options.allSeparate) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        let outcome;

        // export
        if (options.setId) {
          verboseMessage('Exporting authorization policy set to file...');
          outcome = await exportPolicySetToFile(
            options.setId,
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              useStringArrays: true,
              deps: options.deps,
              prereqs: options.prereqs,
            }
          );
        }
        // -a/--all
        else if (options.all) {
          verboseMessage('Exporting all authorization policy sets to file...');
          outcome = await exportPolicySetsToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              useStringArrays: true,
              deps: options.deps,
              prereqs: options.prereqs,
            }
          );
        }
        // -A/--all-separate
        else if (options.allSeparate) {
          verboseMessage(
            'Exporting all authorization policy sets to separate files...'
          );
          outcome = await exportPolicySetsToFiles(
            options.metadata,
            options.modifiedProperties,
            {
              useStringArrays: true,
              deps: options.deps,
              prereqs: options.prereqs,
            }
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
