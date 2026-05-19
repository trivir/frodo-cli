import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  deleteScopeByName,
  deleteScopes,
} from '../../../ops/cloud/iga/IgaScopeOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga scope delete');

  program
    .description('Delete scopes.')
    .addOption(
      new Option(
        '-n, --scope-name <scope-name>',
        'Scope name. If specified, -a is ignored.'
      )
    )
    .addOption(new Option('-a, --all', 'Delete all scopes. Ignored with -n.'))
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
        if (!options.scopeName && !options.all) {
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
        // delete by id
        if (options.scopeName) {
          verboseMessage('Deleting scope...');
          const outcome = await deleteScopeByName(options.scopeName);
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all scopes...');
          const outcome = await deleteScopes();
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
