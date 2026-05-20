import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportEmailTemplatesToFile,
  exportEmailTemplatesToFiles,
  exportEmailTemplateToFile,
} from '../../ops/EmailTemplateOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo email template export',
    [],
    deploymentTypes
  );

  program
    .description('Export email templates.')
    .addOption(
      new Option(
        '-i, --template-id <template-id>',
        'Email template id/name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <template-id>.template.email.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all email templates to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all email templates as separate files <template-id>.template.email.json. Ignored with -i, and -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Does not include metadata in the export file.'
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
        if (!options.templateId && !options.all && !options.allSeparate) {
          printMessage('Unrecognized combination of options or no options...');
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);
        let outcome: boolean;
        // export by id/name
        if (options.templateId) {
          verboseMessage(
            `Exporting email template "${
              options.templateId
            }" from realm "${state.getRealm()}"...`
          );
          outcome = await exportEmailTemplateToFile(
            options.templateId,
            options.file,
            options.metadata
          );
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all email templates to a single file...');
          outcome = await exportEmailTemplatesToFile(
            options.file,
            options.metadata
          );
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all email templates to separate files...');
          outcome = await exportEmailTemplatesToFiles(options.metadata);
        }
        if (!outcome) process.exitCode = 1;
      }
    );

  return program;
}
