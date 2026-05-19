import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';

import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';
import { deleteEvent, deleteEvents } from '../../../ops/cloud/iga/IgaEventsOps';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga events delete');

  program
    .description('Delete events.')
    .addOption(
      new Option(
        '-i, --event-id <event-id>',
        'Event id. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all events.'
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
        if (!options.eventId && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }
        // delete by id
        if (options.eventId) {
          verboseMessage('Deleting event...');
          const outcome = await deleteEvent(options.eventId);
          if (!outcome) process.exit(1);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all events...');
          const outcome = await deleteEvents();
          if (!outcome) process.exit(1);
        }
      }
      // end command logic inside action handler
    );

  return program;
}
