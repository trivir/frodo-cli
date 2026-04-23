import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportPoliciesByPolicySetToFile,
  exportPoliciesByPolicySetToFiles,
  exportPoliciesToFile,
  exportPoliciesToFiles,
  exportPolicyToFile,
} from '../../ops/PolicyOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz policy export');

  program
    .description('Export authorization policies.')
    .addOption(
      new Option(
        '-i, --policy-id <policy-id>',
        'Policy id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '--set-id <set-id>',
        'Export policies in policy set only. Ignored with -i.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Export policies to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export policies to separate files (*.policy.authz.json) in the current directory. Ignored with -i or -a.'
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
      new Option('--no-deps', 'Do not include dependencies (scripts).')
    )
    .addOption(
      new Option(
        '--prereqs',
        'Include prerequisites (policy sets, resource types).'
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
          !options.policyId &&
          !options.setId &&
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

        let outcome;

        // export
        if (options.policyId) {
          verboseMessage('Exporting authorization policy to file...');
          outcome = await exportPolicyToFile(
            options.policyId,
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              prereqs: options.prereqs,
              useStringArrays: true,
            }
          );
        }
        // -a/--all by policy set
        else if (options.setId && options.all) {
          verboseMessage(
            `Exporting all authorization policies in policy set ${options.setId} to file...`
          );
          outcome = await exportPoliciesByPolicySetToFile(
            options.setId,
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              prereqs: options.prereqs,
              useStringArrays: true,
            }
          );
        }
        // -a/--all
        else if (options.all) {
          verboseMessage('Exporting all authorization policies to file...');
          outcome = await exportPoliciesToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              prereqs: options.prereqs,
              useStringArrays: true,
            }
          );
        }
        // -A/--all-separate by policy set
        else if (options.setId && options.allSeparate) {
          verboseMessage(
            `Exporting all authorization policies in policy set ${options.setId} to separate files...`
          );
          outcome = await exportPoliciesByPolicySetToFiles(
            options.setId,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              prereqs: options.prereqs,
              useStringArrays: true,
            }
          );
        }
        // -A/--all-separate
        else if (options.allSeparate) {
          verboseMessage(
            'Exporting all authorization policies to separate files...'
          );
          outcome = await exportPoliciesToFiles(
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              prereqs: options.prereqs,
              useStringArrays: true,
            }
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
