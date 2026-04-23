import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { listRealms } from '../../ops/RealmOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo realm list');

  program
    .description('List realms.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
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
        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        verboseMessage('Listing all realms...');
        await listRealms(options.long);
      }
      // end command logic inside action handler
    );

  return program;
}
