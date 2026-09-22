import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { addExistingServiceAccount } from '../../ops/ConnectionProfileOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;
const { saveConnectionProfile } = frodo.conn;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo log key add',
    ['realm'],
    deploymentTypes
  );

  program
    .alias('save')
    .description('Add log API keys.')
    .addOption(new Option('-i, --key-id <key-id>', 'Key id'))
    .addOption(new Option('-s, --key-secret <key-secret>', 'Key secret'))
    .addOption(
      new Option('-n, --name [name]', 'Optional name for log api connection')
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

        if (options.name) state.setName(options.name);
        else state.setName(state.getHost());

        if (
          options.keyId &&
          options.keySecret &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          await addExistingServiceAccount(
            options.keyId,
            options.keySecret,
            options.validate
          );
          await saveConnectionProfile(state.getName(), state.getHost(), true);
        }
        // unrecognized combination of options or no options
        else {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
      }
      // end command logic inside action handler
    );

  return program;
}
