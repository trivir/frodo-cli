import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  deleteSecretStoreMappingAlias,
  deleteSecretStoreMappingAliases,
} from '../../ops/SecretStoreOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { DEPLOYMENT_TYPES, CLASSIC_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = DEPLOYMENT_TYPES;
const globalDeploymentTypes = [CLASSIC_DEPLOYMENT_TYPE_KEY];

const { canSecretStoreHaveMappings } = frodo.secretStore;

export default function setup() {
  const program = new FrodoCommand(
    'frodo secretstore mapping alias delete',
    [],
    deploymentTypes
  );

  program
    .description('Delete secret store mapping aliases.')
    .addOption(
      new Option(
        '-i, --secretstore-id <secretstore-id>',
        'Secret store id of the secret store where the mapping belongs.'
      )
    )
    .addOption(
      new Option(
        '-t, --secretstore-type <secretstore-type>',
        'Secret store type id. Only necessary if there are multiple secret stores with the same secret store id.'
      )
    )
    .addOption(
      new Option('-s, --secret-id <secret-id>', 'Secret label of the mapping.')
    )
    .addOption(new Option('-a, --alias <alias>', 'The alias to delete.'))
    .addOption(
      new Option(
        '--all',
        'Delete all aliases except for the active one in the mapping. Ignored with -a.'
      )
    )
    .addOption(
      new Option(
        '-g, --global',
        'Delete aliases for global secret stores. For classic deployments only.'
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
          !options.secretstoreId &&
          !options.secretId &&
          !options.alias &&
          !options.all
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        if (
          options.secretstoreType &&
          !canSecretStoreHaveMappings(options.secretstoreType)
        ) {
          printMessage(
            `'${options.secretstoreType}' does not have mappings.`,
            'error'
          );
          process.exit(1);
        }
        const getTokensIsSucessful = await getTokens(
          false,
          true,
          options.global ? globalDeploymentTypes : deploymentTypes
        );
        if (!getTokensIsSucessful) process.exit(1);
        let outcome;
        if (options.secretstoreId && options.secretId && options.alias) {
          verboseMessage(
            `Deleting alias ${options.alias} from secret store mapping ${options.secretId} from secret store ${options.secretstoreId}...`
          );
          outcome = await deleteSecretStoreMappingAlias(
            options.secretstoreId,
            options.secretstoreType,
            options.secretId,
            options.alias,
            options.global
          );
        } else if (options.secretstoreId && options.secretId && options.all) {
          verboseMessage(
            `Deleting all aliases except active one from secret store mapping ${options.secretId} from secret store ${options.secretstoreId}...`
          );
          outcome = await deleteSecretStoreMappingAliases(
            options.secretstoreId,
            options.secretstoreType,
            options.secretId,
            options.global
          );
        }
        if (!outcome) process.exitCode = 1;
      }
    );
  return program;
}
