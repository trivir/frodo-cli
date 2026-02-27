import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importFirstIGAWorkflowFromFile,
  importIGAWorkflowFromFile,
  importIGAWorkflowsFromFile,
  importIGAWorkflowsFromFiles,
} from '../../ops/cloud/iga/IgaWorkflowOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga workflow import',
    [],
    deploymentTypes
  );

  program
    .description('Import IGA workflows.')
    .addOption(
      new Option(
        '-i, --workflow-id <workflow-id>',
        'IGA workflow id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all iga workflows from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all iga workflows from separate files (*.workflow.iga.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .action(
      // implement program logic inside action handler
      async (host, realm, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );
        // import by id
        if (
          options.file &&
          options.workflowId &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(`Importing iga workflow "${options.workflowId}"...`);
          const outcome = await importIGAWorkflowFromFile(
            options.workflowId,
            options.file,
            options.raw
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (
          options.all &&
          options.file &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(
            `Importing all iga workflows from a single file (${options.file})...`
          );
          const outcome = await importIGAWorkflowsFromFile(options.file);
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (
          options.allSeparate &&
          !options.file &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(
            'Importing all iga workflows from separate files (*.workflow.iga.json) in current directory...'
          );
          const outcome = await importIGAWorkflowsFromFiles(options.raw);
          if (!outcome) process.exitCode = 1;
        }
        // import first workflow from file
        else if (
          options.file &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(
            `Importing first iga workflow from file "${options.file}"...`
          );
          const outcome = await importFirstIGAWorkflowFromFile(
            options.file,
            options.raw
          );
          if (!outcome) process.exitCode = 1;
        }
        // unrecognized combination of options or no options
        else {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
