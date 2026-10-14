import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import { configManagerRunPromotion } from '../../../configManagerOps/FrConfigPromoteOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager promote run-dryrun-promotion',
    [],
    deploymentTypes
  );

  program
    .description(
      'Run a dry-run configuration promotion without applying changes.'
    )
    .addOption(
      new Option(
        '--ignore-encrypted-secrets',
        'Ignore encrypted secrets during promotion.'
      )
    )
    .addOption(
      new Option('--unlock-after', 'Unlock environments after promotion.')
    )
    .addOption(
      new Option(
        '--promoter <name>',
        'Name of the person performing the promotion.'
      )
    )
    .addOption(
      new Option('--description <description>', 'Description of the promotion.')
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
      if (await getTokens(false, true, deploymentTypes)) {
        const outcome = await configManagerRunPromotion(
          true,
          options.ignoreEncryptedSecrets,
          options.unlockAfter,
          options.promoter,
          options.description,
          options.ticketReference
        );
        if (!outcome) process.exitCode = 1;
      } else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        process.exitCode = 1;
        program.help();
      }
    });
  return program;
}
