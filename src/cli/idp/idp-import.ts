import { state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importFirstSocialIdentityProviderFromFile,
  importSocialIdentityProviderFromFile,
  importSocialIdentityProvidersFromFile,
  importSocialIdentityProvidersFromFiles,
} from '../../ops/IdpOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo idp import');

  program
    .description('Import (social) identity providers.')
    .addOption(
      new Option(
        '-i, --idp-id <id>',
        'Provider id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the file to import the provider(s) from.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Import all the providers from single file. Ignored with -t or -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all the providers from separate files (*.json) in the current directory. Ignored with -t or -i or -a.'
      )
    )
    .addOption(
      new Option('--no-deps', 'Do not include any dependencies (scripts).')
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
          !options.idpId &&
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
        // import by id
        if (options.file && options.idpId) {
          verboseMessage(
            `Importing provider "${
              options.idpId
            }" into realm "${state.getRealm()}"...`
          );
          outcome = await importSocialIdentityProviderFromFile(
            options.idpId,
            options.file,
            {
              deps: options.deps,
            }
          );
        }
        // --all -a
        else if (options.all && options.file) {
          verboseMessage(
            `Importing all providers from a single file (${options.file})...`
          );
          outcome = await importSocialIdentityProvidersFromFile(options.file, {
            deps: options.deps,
          });
        }
        // --all-separate -A
        else if (options.allSeparate && !options.file) {
          verboseMessage(
            'Importing all providers from separate files in current directory...'
          );
          outcome = await importSocialIdentityProvidersFromFiles({
            deps: options.deps,
          });
        }
        // import first provider from file
        else if (options.file) {
          verboseMessage(
            `Importing first provider from file "${
              options.file
            }" into realm "${state.getRealm()}"...`
          );
          outcome = await importFirstSocialIdentityProviderFromFile(
            options.file,
            {
              deps: options.deps,
            }
          );
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
