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
      // import by id
      if (options.file && options.idpId && (await getTokens())) {
        verboseMessage(
          `Importing provider "${
            options.idpId
          }" into realm "${state.getRealm()}"...`
        );
        await importSocialIdentityProviderFromFile(
          options.idpId,
          options.file,
          {
            deps: options.deps,
          }
        );
      }
      // --all -a
      else if (options.all && options.file && (await getTokens())) {
        verboseMessage(
          `Importing all providers from a single file (${options.file})...`
        );
        await importSocialIdentityProvidersFromFile(options.file, {
          deps: options.deps,
        });
      }
      // --all-separate -A
      else if (options.allSeparate && !options.file && (await getTokens())) {
        verboseMessage(
          'Importing all providers from separate files in current directory...'
        );
        await importSocialIdentityProvidersFromFiles({
          deps: options.deps,
        });
      }
      // import first provider from file
      else if (options.file && (await getTokens())) {
        verboseMessage(
          `Importing first provider from file "${
            options.file
          }" into realm "${state.getRealm()}"...`
        );
        await importFirstSocialIdentityProviderFromFile(options.file, {
          deps: options.deps,
        });
      }
      // unrecognized combination of options or no options
      else {
        printMessage('Unrecognized combination of options or no options...');
        program.help();
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
