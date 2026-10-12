import { frodo } from '@rockcarver/frodo-lib';

import { configManagerDeleteTelemetry } from '../../../configManagerOps/FrConfigTelemetryOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete telemetry',
    [],
    deploymentTypes
  );

  program
    .description('Delete telemetry exporters.')
    .option(
      '-c, --category <category>',
      'Telemetry category to delete (otlp or splunk).'
    )
    .option(
      '-n, --name <name>',
      'Name of a single exporter to delete. Requires --category.'
    )
    .option(
      '--dry-run',
      'Preview telemetry exporters that would be deleted without deleting them.'
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

      if (options.name && !options.category) {
        printMessage(
          'Named telemetry config requires category (e.g. --category otlp)',
          'error'
        );
        process.exitCode = 1;
        return;
      }

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) {
        process.exitCode = 1;
        return;
      }

      verboseMessage('Deleting telemetry.');

      const outcome = await configManagerDeleteTelemetry(
        options.category,
        options.name,
        options.dryRun
      );

      if (!outcome) process.exitCode = 1;
    });

  return program;
}
