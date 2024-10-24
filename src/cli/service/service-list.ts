import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { listServices } from '../../ops/ServiceOps.js';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const program = new FrodoCommand('frodo service list');

program
  .description('List AM services.')
  .addOption(
    new Option('-l, --long', 'Long with all fields.').default(false, 'false')
  )
  .addOption(new Option('-g, --global', 'List global services.'))
  .action(async (host, realm, user, password, options, command) => {
    command.handleDefaultArgsAndOpts(
      host,
      realm,
      user,
      password,
      options,
      command
    );
    if (await getTokens()) {
      verboseMessage(`Listing all AM services for realm: ${realm}`);
      await listServices(options.long, options.global);
    } else {
      process.exitCode = 1;
    }
  });

program.parse();
