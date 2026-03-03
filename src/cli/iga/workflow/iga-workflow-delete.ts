import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  deleteWorkflow,
  deleteWorkflows,
} from '../../../ops/cloud/iga/IgaWorkflowOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga workflow delete');

  program
    .description('Delete workflows.')
    .addOption(
      new Option(
        '-i, --workflow-id <workflow-id>',
        'Workflow id/name. If specified, -a is ignored. By default, deletes both draft and published unless -d or -p are defined exclusively.'
      )
    )
    .addOption(
      new Option(
        '-d, --draft-only',
        'Delete only the draft workflow. Ignored with -a.'
      )
    )
    .addOption(
      new Option(
        '-p, --published-only',
        'Delete only the published workflow. Ignored with -a.'
      )
    )
    .addOption(
      new Option('-a, --all', 'Delete all workflows. Ignored with -i.')
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
        if (!options.workflowId && !options.all) {
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
        if (options.workflowId) {
          verboseMessage('Deleting workflow...');
          const outcome = await deleteWorkflow(
            options.workflowId,
            options.draftOnly,
            options.publishedOnly
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all workflows...');
          const outcome = await deleteWorkflows();
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
