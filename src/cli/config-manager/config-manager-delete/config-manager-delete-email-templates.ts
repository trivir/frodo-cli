import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteEmailTemplates } from '../../../configManagerOps/FrConfigEmailTemplatesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete email-templates',
    [],
    deploymentTypes
  );

  program
    .description('Delete email template objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Email template name; deletes only the email template with the specified name.'
      )
    )
    .addOption(
      new Option('--dry-run', 'Show which email templates would be deleted.')
    )
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Deleting config entity email-templates');
        const outcome = await configManagerDeleteEmailTemplates(
          options.name,
          options.dryRun
        );
        if (!outcome) process.exitCode = 1;
      } else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        process.exitCode = 1;
        program.help();
      }
    });

  return program;
}
