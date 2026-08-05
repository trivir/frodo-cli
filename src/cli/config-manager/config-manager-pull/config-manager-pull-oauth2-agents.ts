import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  configManagerExportConfigAgents,
} from '../../../configManagerOps/FrConfigOauth2AgentOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager pull oauth2-agents',
    deploymentTypes
  );

  program
    .description('Export OAuth2 Agents')
    .addOption(
      new Option(
        '-f, --file <file>',
        'The OAUTH2_AGENTS_CONFIG json file. ex: "/home/trivir/Documents/oauth2-agents.json", or "oauth2-agents.json"'
      )
    )
    .addHelpText(
      'after',
      'HELP MESSAGE:\n' +
        'Make sure to create the export config file: oauth2-agents.json to run this command.\n' +
        'Example command: frodo config-manager pull oauth2-agents -f oauth2-agents.json -D ../testDir frodo-dev\n\n' +
        `Config file example:\n` +
        '------------  Example Oauth2 agents export config for oauth2-agents.json file -----------\n' +
        '{\n' +
        ' "alpha": {\n' +
        '   "2.2_Agent": [\n' +
        '     {"id": "my-policy-agent"}\n' +
        '    ],\n' +
        '   "RemoteConsentAgent": [\n' +
        '     {"id": "test", "overrides":{"testestest": "hotdog"}}\n' +
        '   ],\n' +
        '   "SoftwarePublisher": [\n' +
        '     {"id": "test software publisher"}\n' +
        '   ],\n' +
        '    "IdentityGatewayAgent": [\n' +
        '     {"id": "cdsso-ig-agent"},\n' +
        '     {"id": "frodo-test-ig-agent"},\n' +
        '     {"id": "frodo-test-ig-agent2"},\n' +
        '     {"id": "ig-agent", "overrides": {"yes": "no, not yes", "taco":"sandwich"}}\n' +
        '   ],\n' +
        '   "J2EEAgent": [\n' +
        '     {"id": "frodo-test-java-agent"},\n' +
        '     {"id": "frodo-test-java-agent2"}\n' +
        '   ],\n' +
        '   "WebAgent": [\n' +
        '     {"id": "frodo-test-web-agent"},\n' +
        '      {"id": "frodo-test-web-agent2"}\n' +
        '   ]\n' +
        ' }\n' +
        '}\n' +
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

      if (await getTokens(false, true, deploymentTypes)) {
        printMessage(
          `Exporting all the agents defined in the provided config file.`)
        const outcome = await configManagerExportConfigAgents(options.file);
        if (!outcome) process.exit(1);
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
