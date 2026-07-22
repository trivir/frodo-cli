import { frodo } from '@rockcarver/frodo-lib';

import { configManagerImportTelemetry } from '../../../configManagerOps/FrConfigTelemetry';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push telemetry',
    [],
    deploymentTypes
  );
  program
    .description('Import telemetry exporters.')
    .option(
      '-c, --category <category>',
      'Telemetry category to import (otlp or splunk).'
    )
    .option(
      '-N, --name <name>',
      'Name of a single exporter to import. Requires --category.'
    )
    .option(
      '-e, --env <value>',
      'Value to resolve placeholders with for a single named exporter. Requires --name.'
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
      if (options.env && !options.name) {
        printMessage(
          'The -e option requires -N to target a single exporter.',
          'error'
        );
        process.exitCode = 1;
        return;
      }
      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Importing telemetry');
        const outcome = await configManagerImportTelemetry(
          options.category,
          options.name,
          options.env
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
    });
  return program;
}
