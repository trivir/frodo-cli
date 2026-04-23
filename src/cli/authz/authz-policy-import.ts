import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importFirstPolicyFromFile,
  importPoliciesFromFile,
  importPoliciesFromFiles,
  importPolicyFromFile,
} from '../../ops/PolicyOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo authz policy import');

  program
    .description('Import authorization policies.')
    .addOption(
      new Option(
        '-i, --policy-id <policy-id>',
        'Policy id. If specified, only one policy is imported and the options -a and -A are ignored.'
      )
    )
    .addOption(
      new Option('--set-id <set-id>', 'Import policies into this policy set.')
    )
    .addOption(new Option('-f, --file <file>', 'Name of the file to import.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all policies from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all policies from separate files (*.policy.authz.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not import dependencies (scripts) even if they are available in the import file.'
      )
    )
    .addOption(
      new Option(
        '--prereqs',
        'Import prerequisites (policy sets, resource types) if they are available in the import file.'
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
          !options.all &&
          !options.allSeparate &&
          !options.file
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

        // import
        if (options.policyId) {
          verboseMessage('Importing authorization policy from file...');
          outcome = await importPolicyFromFile(options.policyId, options.file, {
            deps: options.deps,
            prereqs: options.prereqs,
            policySetName: options.setId,
          });
        }
        // -a/--all
        else if (options.all) {
          verboseMessage('Importing all authorization policies from file...');
          outcome = await importPoliciesFromFile(options.file, {
            deps: options.deps,
            prereqs: options.prereqs,
            policySetName: options.setId,
          });
        }
        // -A/--all-separate
        else if (options.allSeparate) {
          verboseMessage(
            'Importing all authorization policies from separate files...'
          );
          outcome = await importPoliciesFromFiles({
            deps: options.deps,
            prereqs: options.prereqs,
            policySetName: options.setId,
          });
        }
        // import first policy set from file
        else if (options.file) {
          verboseMessage(
            `Importing first authorization policy from file "${options.file}"...`
          );
          outcome = await importFirstPolicyFromFile(options.file, {
            deps: options.deps,
            prereqs: options.prereqs,
            policySetName: options.setId,
          });
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
