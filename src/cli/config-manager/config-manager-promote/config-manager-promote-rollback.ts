import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import { configManagerRollback } from '../../../configManagerOps/FrConfigPromoteOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager promote rollback',
    [],
    deploymentTypes
  );
  program
    .description('Roll back the previous promotion.')
    .addOption(
      new Option('--unlock-after', 'Unlock environments after rollback.')
    )
    .addOption(
      new Option(
        '--promoter <name>',
        'Name of the person performing the rollback.'
      )
    )
    .addOption(
      new Option('--description <description>', 'Description of the rollback.')
    )
    .addOption(
      new Option('--ticket-reference <reference>', 'Zendesk ticket reference.')
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
      verboseMessage('Rolling back promotion.');
      const outcome = await configManagerRollback(
        options.unlockAfter,
        options.promoter,
        options.description,
        options.ticketReference
      );
      if (!outcome) process.exitCode = 1;
    });
  return program;
}
