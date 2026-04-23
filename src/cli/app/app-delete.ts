import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import * as s from '../../help/SampleData';
import {
  deleteApplication,
  deleteApplications,
} from '../../ops/ApplicationOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand('frodo app delete', [], deploymentTypes);

  program
    .description('Delete applications.')
    .addOption(
      new Option(
        '-i, --app-id <id>',
        'Application id. If specified, -n and -a are ignored.'
      )
    )
    .addOption(
      new Option(
        '-n, --app-name <name>',
        'Application name. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option('-a, --all', 'Delete all applications. Ignored with -i or -n.')
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

        if (!options.appId && !options.appName && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          return;
        }

        const getTokensisSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensisSuccessful) process.exit(1);
        let outcome;

        // -i/--app-id or -n/--app-name
        if (options.appId || options.appName) {
          verboseMessage('Deleting application...');
          outcome = await deleteApplication(
            options.appId,
            options.appName,
            options.deep
          );
        }
        // -a/--all
        else if (options.all) {
          verboseMessage('Deleting all applications...');
          outcome = await deleteApplications(options.deep);
        }
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
