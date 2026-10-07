import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteSecrets } from '../../../configManagerOps/FrConfigSecretOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete secrets',
    [],
    deploymentTypes
  );

  program
    .description('Delete secrets.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Secret name; delete only the specified secret. If omitted, all secrets are deleted.'
      )
    )
    .addOption(
      new Option(
        '--dry-run',
        'Show which secrets would be deleted without deleting them.'
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

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);

      verboseMessage('Deleting secrets from cloud');
      const outcome = await configManagerDeleteSecrets(
        options.name,
        options.dryRun
      );
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
