import { Option } from 'commander';
import { configManagerExportRaw } from '../../../configManagerOps/FrConfigRawOps';
import * as s from '../../../help/SampleData';
import { getTokens } from '../../../ops/AuthenticateOps';
import { FrodoCommand, ObjectOption } from '../../FrodoCommand';
import { printMessage } from '../../../utils/Console';

export default function setup() {
  const program = new FrodoCommand('frodo config-manager pull raw');

  program
    .description('Export raw configurations.')
    .addOption(
      new Option(
        '-f, --config-file <file>',
        'The file path of the service object config file. '
      ).makeOptionMandatory()
    )
    .addOption(
      new Option(
        '-o, --stdout',
        'Write exported configuration to standard output.'
      )
    )
    .addOption(
      new ObjectOption(
        '-x, --push-api-version <value>',
        'Push API versions; set properties using dot notation, for example: -x.myApi 1.0 --push-api-version.otherApi 2.0'
      ).default({})
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
        `Example command: frodo config-manager pull raw -f raw.json -D ../testDir ${s.connId}\n\n` +
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
    .multiOp()
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
        process.exitCode = 1;
        return;
      }
      const apiVersion = options.pushApiVersion ?? {};

      if (
        Object.keys(apiVersion).length > 0 &&
        (!apiVersion.protocol || !apiVersion.resource)
      ) {
        printMessage(
          '--push-api-version requires resource and protocol versions.',
          'error'
        );
        process.exitCode = 1;
        return;
      }
      
      if (await getTokens()) {
        const outcome: boolean = await configManagerExportRaw(
          options.configFile,
          options.allowFailures,
          apiVersion,
          options.path,
          options.stdout
        );
        if (!outcome) process.exitCode = 1;
      } else {
        process.exitCode = 1;
      }
    });

  return program;
}
