import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  deleteAllIGAWorkflows,
  deleteIGAWorkflowById,
} from '../../ops/cloud/iga/IgaWorkflowOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga workflow delete');

  program
    .description('Delete iga workflows.')
    .addOption(
      new Option(
        '-i, --workflow-id <workflow-id>',
        'IGA workflow id/name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all policies in a realm. Ignored with -i.'
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
        // delete by id
        if (options.workflowId && (await getTokens())) {
          verboseMessage('Deleting iga workflow...');
          const outcome = await deleteIGAWorkflowById(options.workflowId);
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all && (await getTokens())) {
          verboseMessage('Deleting all iga workflows...');
          const outcome = await deleteAllIGAWorkflows();
          if (!outcome) process.exitCode = 1;
        }
        // unrecognized combination of options or no options
        else {
          printMessage('Unrecognized combination of options or no options...');
          program.help();
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
