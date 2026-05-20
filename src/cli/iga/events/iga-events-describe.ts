import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeEvent } from '../../../ops/cloud/iga/IgaEventsOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga events describe');

  program
    .description('Describe events.')
    .addOption(
      new Option(
        '-i, --event-id <event-id>',
        'event id. If not specified, will describe first event in the provided export file.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the event export file to describe. If not specified, will automatically pull the event export data of the provided id from the tenant.'
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
      if (!options.eventId && !options.file) {
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
      verboseMessage(`Describing event ${options.eventId}...`);
      const outcome = await describeEvent(options.eventId, options.file);
      if (!outcome) process.exit(1);
    });

  return program;
}
