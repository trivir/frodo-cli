import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeScope } from '../../../ops/cloud/iga/IgaScopeOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;
const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga scope describe');
  program
    .description('Describe scopes.')
    .addOption(
      new Option(
        '-n, --name <scope-name>',
        'Scope name. If not specified, will describe the first scope in the provided export file, or the first scope in the tenant if no file is provided.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the scope export file to describe. If not specified, will pull scope data from the tenant.'
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
      verboseMessage(
        options.name
          ? `Describing scope ${options.name}...`
          : options.file
            ? `Describing first scope in ${options.file}...`
            : 'Describing first scope in tenant...'
      );
      const outcome = await describeScope(options.name, options.file);
      if (!outcome) process.exitCode = 1;
    });
  return program;
}
