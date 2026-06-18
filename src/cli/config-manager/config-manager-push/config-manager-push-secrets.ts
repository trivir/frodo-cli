import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportSecrets } from '../../../configManagerOps/FrConfigSecretOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push secrets',
    [],
    deploymentTypes
  );

  program
    .description('Import secrets.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Secret name; import only the specified secret'
      )
    )
    .addOption(
      new Option(
        '-e, --env <values>',
        'Value to set for the secret. Will override .env files and environment variables.'
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

      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Importing secrets');
        const outcome = await configManagerImportSecrets(
          options.name,
          options.env
        );
        if (!outcome) process.exitCode = 1;
      }
      // unrecognized combination of options or no options
      else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
      }
    });

  return program;
}
