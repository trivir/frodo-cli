import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  createVersionOfSecret,
  createVersionOfSecretFromFile,
} from '../../ops/SecretsOps';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const program = new FrodoCommand('frodo esv secret version create');

program
  .description('Create new version of secret.')
  .addOption(new Option('-i, --secret-id <secret-id>', 'Secret id.'))
  .addOption(new Option('--value <value>', 'Secret value.'))
  .addOption(
    new Option(
      '-f, --file [file]',
      'Name of the file to read pem or base64hmac encoded secret from. Ignored if --value is specified'
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
      if (await getTokens()) {
        verboseMessage('Creating new version of secret...');
        let outcome = null;
        if (options.value) {
          outcome = await createVersionOfSecret(
            options.secretId,
            options.value
          );
        } else {
          outcome = await createVersionOfSecretFromFile(
            options.secretId,
            options.file
          );
        }
        if (!outcome) process.exitCode = 1;
      } else {
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
