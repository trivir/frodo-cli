import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  deleteSecretStore,
  deleteSecretStores,
} from '../../ops/SecretStoreOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLASSIC_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLASSIC_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo secretstore delete',
    [],
    deploymentTypes
  );

  program
    .description('Delete secret stores.')
    .addOption(
      new Option(
        '-i, --secretstore-id <secretstore-id>',
        'Secret store id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-t, --secretstore-type <secretstore-type>',
        'Secret store type id of the secret store. Only necessary if there are multiple secret stores with the same secret store id. Ignored if -i is not specified.'
      )
    )
    .addOption(new Option('-g, --global', 'Delete global secret stores.'))
    .addOption(
      new Option('-a, --all', 'Delete all secret stores. Ignored with -i.')
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
        if (!options.secretstoreId && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSucessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSucessful) process.exit(1);
        let outcome: boolean;

        if (options.secretstoreId) {
          verboseMessage(`Deleting secret store ${options.secretstoreId}...`);
          outcome = await deleteSecretStore(
            options.secretstoreId,
            options.secretstoreType,
            options.global
          );
        } else if (options.all) {
          verboseMessage(
            `Deleting all${options.global ? ' global' : ''} secret stores...`
          );
          outcome = await deleteSecretStores(options.global);
        }
        if (!outcome) process.exitCode = 1;
      }
    );
  return program;
}
