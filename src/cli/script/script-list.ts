import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { listScripts } from '../../ops/ScriptOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo script list');

program
  .description('List scripts.')
  .addOption(
    new Option('-l, --long', 'Long with all fields besides usage.').default(
      false,
      'false'
    )
  )
  .addOption(
    new Option('-u, --usage', 'Display usage field.').default(false, 'false')
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
      if (await getTokens()) {
        verboseMessage(`Listing scripts in realm "${state.getRealm()}"...`);
        const outcome = await listScripts(options.long, options.usage);
        if (!outcome) process.exitCode = 1;
      } else {
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
