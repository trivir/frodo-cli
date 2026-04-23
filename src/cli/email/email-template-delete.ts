import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  deleteAllEmailTemplates,
  deleteEmailTemplateById,
} from '../../ops/EmailTemplateOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo email template delete');

  program
    .description('Delete email templates.')
    .addOption(
      new Option(
        '-i, --template-id <template-id>',
        'Email template id/name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all policies in a realm. Ignored with -i.'
      )
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

        if (!options.templateId && !options.all) {
          printMessage('Unrecognized combination of options or no options...');
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome;
        // delete by id
        if (options.templateId) {
          verboseMessage('Deleting email template...');
          outcome = await deleteEmailTemplateById(options.templateId);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all email templates...');
          outcome = await deleteAllEmailTemplates();
        }
        if (!outcome) process.exitCode = 1;
      }
    );

  return program;
}
