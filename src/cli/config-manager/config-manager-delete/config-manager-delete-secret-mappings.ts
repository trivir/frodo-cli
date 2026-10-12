import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteSecretMappings } from '../../../configManagerOps/FrConfigSecretMappingsOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, DEFAULT_REALM_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete secret-mappings',
    [],
    deploymentTypes
  );

  program
    .description('Delete secret mappings.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Secret mapping ID; delete only the specified mapping. If omitted, all mappings in the selected realms are deleted.'
      )
    )
    .addOption(
      new Option(
        '--dry-run',
        'Show which secret mappings would be deleted without deleting them.'
      )
    )
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      if (options.name && (!realm || realm === DEFAULT_REALM_KEY)) {
        printMessage(
          'The -n/--name option requires a realm argument to be specified.',
          'error'
        );
        process.exitCode = 1;
        return;
      }

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);

      verboseMessage('Deleting secret mappings configuration.');
      const outcome = await configManagerDeleteSecretMappings(
        options.name,
        realm,
        options.dryRun
      );
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
