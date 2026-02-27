import { Option } from 'commander';
import c from 'tinyrainbow';

import * as s from '../../help/SampleData';
import { listApplications } from '../../ops/ApplicationOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand('frodo app list', [], deploymentTypes);

  program
    .description('List applications.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
    )
    .addHelpText(
      'after',
      c.yellow(`Important Note:\n`) +
        `  The ${c.cyan('frodo app')} command to manage OAuth2 clients in v1.x has been renamed to ${c.cyan('frodo oauth client')} in v2.x\n` +
        `  The ${c.cyan('frodo app')} command in v2.x manages the new applications created using the new application templates in ForgeRock Identity Cloud. To manage oauth clients, use the ${c.cyan('frodo oauth client')} command.\n\n` +
        `Usage Examples:\n` +
        `  List applications using AM base URL, username, and password (note the quotes around password to allow special characters):\n` +
        c.cyan(
          `  $ frodo app list ${s.amBaseUrl} ${s.username} '${s.password}'\n`
        ) +
        `  List applications using a connection profile (identified by the full AM base URL):\n` +
        c.cyan(`  $ frodo app list ${s.amBaseUrl}\n`) +
        `  List applications using a connection profile (identified by a unique substring of the AM base URL or a saved alias):\n` +
        c.cyan(`  $ frodo app list ${s.connId}\n`)
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
        if (await getTokens(false, true, deploymentTypes)) {
          verboseMessage(`Listing applications...`);
          const outcome = await listApplications(options.long);
          if (!outcome) process.exitCode = 1;
        } else {
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
