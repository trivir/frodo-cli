import { Option } from 'commander';
import c from 'tinyrainbow';

import * as s from '../../help/SampleData';
import { getTokens } from '../../ops/AuthenticateOps';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand('frodo app describe', [], deploymentTypes);

  program
    .description('Describe application.')
    .addOption(
      new Option(
        '-i, --app-id <id>',
        'Application id. If specified, -n is ignored.'
      )
    )
    .addOption(new Option('-n, --app-name <name>', 'Application name.'))
    .addHelpText(
      'after',
      c.yellow(`Important Note:\n`) +
        `  The ${c.cyan('frodo app')} command to manage OAuth2 clients in v1.x has been renamed to ${c.cyan('frodo oauth client')} in v2.x\n` +
        `  The ${c.cyan('frodo app')} command in v2.x manages the new applications created using the new application templates in ForgeRock Identity Cloud. To manage oauth clients, use the ${c.cyan('frodo oauth client')} command.\n\n` +
        `Usage Examples:\n` +
        `  Describe application 'myApp':\n` +
        c.cyan(`  $ frodo app describe -i myApp ${s.connId}\n`) +
        `  Describe application 'myApp' in raw JSON:\n` +
        c.cyan(`  $ frodo app describe -i myApp --json ${s.connId}\n`)
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
          // code goes here
        } else {
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
