import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerDeleteVariables } from '../../../configManagerOps/FrConfigVariableOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete variables',
    [],
    deploymentTypes
  );

  program
    .description('Delete variables.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Variable name; delete only the specified variable. If omitted, all variables are deleted.'
      )
    )
    .addOption(
      new Option(
        '--dry-run',
        'Show which variables would be deleted without deleting them.'
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
      if (!getTokensIsSuccessful) process.exit(1);

      verboseMessage('Deleting variables');
      const outcome = await configManagerDeleteVariables(
        options.name,
        options.dryRun
      );
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
