import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportEmailTemplates } from '../../../configManagerOps/FrConfigEmailTemplatesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push email-templates',
    [],
    deploymentTypes
  );

  program
    .description('Import email template objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Email template name; imports only the email template with the specified name.'
      )
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

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);
      if (options.name) {
        verboseMessage(`Importing email template with name "${options.name}"`);
      } else {
        verboseMessage('Importing all email templates');
      }
      const outcome = await configManagerImportEmailTemplates(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
