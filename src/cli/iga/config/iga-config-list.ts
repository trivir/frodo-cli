import { frodo, state } from '@rockcarver/frodo-lib';

import { getTokens } from '../../../ops/AuthenticateOps';
import { listConfig } from '../../../ops/cloud/iga/IgaConfigOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga config list',
    [],
    deploymentTypes
  );

  program
    .description('List config.')

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
        verboseMessage(`Listing iga config ...`);
        const outcome = await listConfig();
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
