import { Option } from 'commander';

import * as s from '../../help/SampleData';
import {
  deleteApplication,
  deleteApplications,
} from '../../ops/ApplicationOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const program = new FrodoCommand('frodo app delete');

program
  .description('Delete applications.')
  .addOption(
    new Option(
      '-i, --app-id <id>',
      'Application name. If specified, -a and -A are ignored.'
    )
  )
  .addOption(
    new Option('-a, --all', 'Delete all applications. Ignored with -i.')
  )
  .addOption(
    new Option(
      '--no-deep',
      'No deep delete. This leaves orphaned configuration artifacts behind.'
    )
  )
  .addHelpText(
    'after',
    `Important Note:\n`['brightYellow'] +
      `  The ${'frodo app'['brightCyan']} command to manage OAuth2 clients in v1.x has been renamed to ${'frodo oauth client'['brightCyan']} in v2.x\n` +
      `  The ${'frodo app'['brightCyan']} command in v2.x manages the new applications created using the new application templates in ForgeRock Identity Cloud. To manage oauth clients, use the ${'frodo oauth client'['brightCyan']} command.\n\n` +
      `Usage Examples:\n` +
      `  Delete application 'myApp':\n` +
      `  $ frodo app delete -i 'myApp' ${s.amBaseUrl}\n`['brightCyan'] +
      `  Delete all applications:\n` +
      `  $ frodo app delete -a ${s.connId}\n`['brightCyan']
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
      // delete app by name
      if (options.appId && (await getTokens())) {
        verboseMessage('Deleting application...');
        const status = await deleteApplication(options.appId, options.deep);
        if (!status) process.exitCode = 1;
      }
      // -a/--all
      else if (options.all && (await getTokens())) {
        verboseMessage('Deleting all applications...');
        const status = await deleteApplications(options.deep);
        if (!status) process.exitCode = 1;
      }
      // unrecognized combination of options or no options
      else {
        verboseMessage('Unrecognized combination of options or no options...');
        program.help();
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
