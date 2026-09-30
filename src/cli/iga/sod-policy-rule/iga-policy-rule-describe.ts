import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describePolicyRule } from '../../../ops/cloud/iga/IgaSodPolicyRuleOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga policy-rule describe');

  program
    .description('Describe Policy Rule.')
    .addOption(
      new Option(
        '-n, --rule-name <policy-name>',
        'Rule name. If not specified, will describe first rule in the provided export file.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the policy export file to describe. If not specified, will automatically pull the policy export data of the provided id from the tenant.'
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
      if (!options.ruleName && !options.file) {
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
      verboseMessage(`Describing policy ${options.ruleName}...`);
      const outcome = await describePolicyRule(options.ruleName, options.file);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
