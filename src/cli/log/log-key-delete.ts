import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { deleteLogApiKey, deleteLogApiKeys } from '../../ops/LogOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo log key delete',
    ['realm'],
    deploymentTypes
  );

  program
    .description('Delete log API keys.')
    .addOption(
      new Option('-i, --key-id <key-id>', 'Key id. Regex if specified with -a.')
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all keys. Optionally specify regex filter -i.'
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
        if (!options.keyId && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSucessful = await getTokens(
          true,
          true,
          deploymentTypes
        );
        if (!getTokensIsSucessful) process.exit(1);

        // delete by id
        if (options.keyId) {
          verboseMessage(`Deleting key ${options.keyId}`);
          deleteLogApiKey(options.keyId);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting keys...');
          deleteLogApiKeys();
        }
      }
    );

  return program;
}
