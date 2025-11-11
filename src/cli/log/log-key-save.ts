import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { updateLogApiKey } from '../../ops/LogOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo log key save',
    ['realm'],
    deploymentTypes
  );

  program
    .description('Save an existing API key to a connection profile.')
    .addOption(
      new Option('-i, --key-id <id>', 'ID of the API key.').makeOptionMandatory()
    )
    .addOption(
        new Option('-s, --key-secret <secret>', 'Secret of the API key.').makeOptionMandatory()
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
        if (await getTokens(true, true, deploymentTypes)) {
          verboseMessage(`Saving log API key to connection profile ${host}...`);
          const outcome = await updateLogApiKey(options.keyId, options.keySecret);
          if (!outcome) process.exitCode = 1;
        } else {
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
