import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { deleteConfigEntityById } from '../../ops/IdmOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo idm delete');

  interface ServiceDeleteOptions {
    id?: string;
    type?: string;
    insecure?: boolean;
    verbose?: boolean;
    debug?: boolean;
    curlirize?: boolean;
    all?: boolean;
    global?: boolean;
  }

  program
    .description('Delete AM services.')
    .addOption(new Option('-i, --id <id>', 'Id of Service to be deleted.'))
    .action(
      async (
        host: string,
        realm: string,
        user: string,
        password: string,
        options: ServiceDeleteOptions,
        command
      ) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );

        // const globalConfig = options.global ?? false;
        if (!options.id) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }

        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        if (options.id) {
          const outcome = await deleteConfigEntityById(options.id);
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
