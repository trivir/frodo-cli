import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportPolicyRulesToFile,
  exportPolicyRulesToFiles,
  exportPolicyRuleToFile,
} from '../../../ops/cloud/iga/IgaSodPolicyRuleOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga policy-rule export',
    [],
    deploymentTypes
  );

  program
    .description('Export policy rules.')
    .addOption(
      new Option(
        '-n, --rule-name <rule-name>',
        'Rule name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <rule-name>.rule.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all policies to a single file. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all policies as separate files <name>.rule.json. Ignored with -n and -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Do not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '-M, --modified-properties',
        'Include modified properties in export (e.g. lastModifiedDate, lastModifiedBy, createdBy, creationDate, etc.)'
      ).default(false, 'false')
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
      if (!options.ruleName && !options.all && !options.allSeparate) {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
        return;
      }
      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) {
        printMessage('Error getting tokens', 'error');
        process.exitCode = 1;
        return;
      }
      if (!state.getIsIGA()) {
        printMessage(
          'Command not supported for non-IGA cloud tenants',
          'error'
        );
        process.exitCode = 1;
        return;
      }
      // --policy-name -n
      if (options.ruleName) {
        verboseMessage(`Exporting policy "${options.ruleName}"...`);
        const outcome = await exportPolicyRuleToFile(
          options.ruleName,
          options.file,
          options.metadata,
          options.modifiedProperties
        );
        if (!outcome) process.exitCode = 1;
      }
      // --all -a
      else if (options.all) {
        verboseMessage('Exporting all policies to a single file...');
        const outcome = await exportPolicyRulesToFile(
          options.file,
          options.metadata,
          options.modifiedProperties
        );
        if (!outcome) process.exitCode = 1;
      }
      // --all-separate -A
      else if (options.allSeparate) {
        verboseMessage('Exporting all policies to separate files...');
        const outcome = await exportPolicyRulesToFiles(
          options.metadata,
          options.modifiedProperties
        );
        if (!outcome) process.exitCode = 1;
      }
    });

  return program;
}
