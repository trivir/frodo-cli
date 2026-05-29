import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeConfigByKey } from '../../../ops/cloud/iga/IgaConfigOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga config describe');

  program
    .description('Describe iga config.')
    .addOption(
      new Option(
        '-n, --config-key <config-key>',
        'Iga config key. If not specified, will describe first iga config key in the provided export file.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the iga config export file to describe. If not specified, will automatically pull the iga config export data of the provided id from the tenant.'
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
      if (!options.configKey && !options.file) {
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
      verboseMessage(`Describing iga config ${options.configKey}...`);
      const outcome = await describeConfigByKey(
        options.configKey,
        options.file
      );
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
