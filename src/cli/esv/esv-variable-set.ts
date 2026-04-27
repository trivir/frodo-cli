import { frodo } from '@rockcarver/frodo-lib';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  setVariableDescription,
  updateVariable,
} from '../../ops/cloud/VariablesOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo esv variable set',
    ['realm'],
    deploymentTypes
  );

  program
    .description('Set variable description.')
    .requiredOption('-i, --variable-id <variable-id>', 'Variable id.')
    .option('--value [value]', 'Variable value.')
    .option('--description [description]', 'Variable description.')
    .action(
      // implement command logic inside action handler
      async (host, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          user,
          password,
          options,
          command
        );
        if (!options.variableId && !options.value && !options.description) {
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
        let outcome: boolean;

        if (options.variableId && options.value && options.description) {
          verboseMessage('Updating variable...');
          outcome = await updateVariable(
            options.variableId,
            options.value,
            options.description
          );
        } else if (options.variableId && options.description) {
          verboseMessage('Updating variable...');
          outcome = await setVariableDescription(
            options.variableId,
            options.description
          );
        }
        if (!outcome) process.exitCode = 1;
      }
    );

  return program;
}
