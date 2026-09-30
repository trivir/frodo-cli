import { Option } from 'commander';

import { configManagerExportRaw } from '../../../configManagerOps/FrConfigRawOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo config-manager pull raw');

  program
    .description('Export raw configurations.')
    .addOption(
      new Option(
        '-f, --config-file <file>',
        'The file path of the raw config export file. '
      )
    )
    .addOption(
      new Option(
        '-o, --stdout',
        'Write exported configuration to standard output.'
      )
    )
    .addOption(
      new Option(
        '-x, --push-api-version',
        'Will include any push API versions. '
      )
    )
    .addOption(
      new Option(
        '-p, --path <path>',
        'Tenant API path to export. Will override --config-file.'
      )
    )
    .addHelpText(
      'after',
      'HELP MESSAGE:\n' +
        'Make sure to create an export config file: raw.json to run this command.\n' +
        'Example command: frodo config-manager pull raw -f raw.json -D ../testDir frodo-dev\n\n' +
        `Config file example:\n` +
        '------------  Example raw export config file raw.json -----------\n' +
        '[\n' +
        '  { "path": "/openidm/config/authentication" },\n' +
        '  {\n' +
        '    "path": "/am/json/realms/root/realms/alpha/realm-config/webhooks/test-webhook",\n' +
        '    "overrides": { "url": "${TEST_WEBHOOK_URL}" },\n' +
        '    "pushApiVersion": {\n' +
        '      "protocol": "2.0",\n' +
        '      "resource": "1.0"\n' +
        '    }\n' +
        '  },\n' +
        '  {"path": "/environment/release"}\n' +
        ']  \n' +
        '* -------------------------------------------------------------------------------------------- \n'
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

      if (!options.path && !options.configFile) {
        printMessage(
          'Specify --path or --config-file to export raw configuration.',
          'error'
        );
        process.exit(1);
      }

      if (
        !options.pushApiVersion.protocol ||
        !options.pushApiVersion.resource
      ) {
        printMessage(
          '--push-api-version requires resource and protocol versions.',
          'error'
        );
        process.exit(1);
      }

      const getTokensIsSuccessful = await getTokens();
      if (!getTokensIsSuccessful) process.exit(1);
      verboseMessage('Exporting raw configuration.');
      const outcome = await configManagerExportRaw(
        options.pushApiVersion,
        options.path,
        options.configFile,
        options.stdout
      );
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
