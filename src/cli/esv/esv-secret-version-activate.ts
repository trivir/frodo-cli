import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { activateVersionOfSecret } from '../../ops/SecretsOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const program = new FrodoCommand('frodo esv secret version activate');

program
  .description('Activate versions of secrets.')
  .addOption(new Option('-i, --secret-id <secret-id>', 'Secret id.'))
  .addOption(new Option('-v, --version <version>', 'Version of secret.'))
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
      // activate by id
      if (options.secretId && options.version && (await getTokens())) {
        verboseMessage(`Activating version of secret...`);
        const outcome = await activateVersionOfSecret(
          options.secretId,
          options.version
        );
        if (!outcome) process.exitCode = 1;
      }
      // unrecognized combination of options or no options
      else {
        printMessage('Unrecognized combination of options or no options...');
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
