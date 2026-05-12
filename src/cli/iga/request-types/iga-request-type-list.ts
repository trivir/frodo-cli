import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { listRequestTypes } from '../../../ops/cloud/iga/IgaRequestTypesOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga request types list',
    [],
    deploymentTypes
  );

  program
    .description('List request types.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
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
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) {
          printMessage('Error getting tokens', 'error');
          process.exit(1);
        }
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }
        verboseMessage(`Listing request types ...`);
        const outcome = await listRequestTypes(options.long);
        if (!outcome) process.exit(1);
      }
      // end command logic inside action handler
    );

  return program;
}
