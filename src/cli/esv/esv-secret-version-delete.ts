import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { deleteVersionOfSecret } from '../../ops/cloud/SecretsOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo esv secret version delete',
    ['realm'],
    deploymentTypes
  );

  program
    .description('Delete versions of secrets.')
    .addOption(
      new Option(
        '-i, --secret-id <secret-id>',
        'Secret id. If specified, -a is ignored.'
      )
    )
    .addOption(new Option('-v, --version <version>', 'Version of secret.'))
    .addOption(
      new Option('-a, --all', 'Delete all secrets in a realm. Ignored with -i.')
    )
    .action(
      // implement command logic inside action handler
      async (host, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          user,
          password,
          options,
          command
        );
        if (!options.secretId && !options.version) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome: boolean;

        // delete by id
        if (options.secretId && options.version) {
          verboseMessage(`Deleting version of secret...`);
          outcome = await deleteVersionOfSecret(
            options.secretId,
            options.version
          );
        }
        if (!outcome) process.exitCode = 1;

        // --all -a
        // else if (options.all && (await getTokens(false, true, deploymentTypes))) {
        //   printMessage('Deleting all versions...');
        //   outcome = deleteJourneys(options);
        //   if (!outcome) process.exitCode = 1;
        // }
      }
    );

  return program;
}
