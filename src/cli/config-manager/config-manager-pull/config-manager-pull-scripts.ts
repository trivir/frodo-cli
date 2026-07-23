import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportScripts } from '../../../configManagerOps/FrConfigScriptOps';
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
    'frodo config-manager pull scripts',
    deploymentTypes
  );

  program
    .description('Export authorization scripts.')
    .addOption(
      new Option(
        '-n, --script-name <script name>',
        'Export specific script using filename. Omit file extension.'
      )
    )
    // added because fr-config manager has a SCRIPT_PREFIXES=[] variable in its .env configuration file to specify scripts
    .addOption(
      new Option(
        '-p, --prefix <prefix>',
        'Export all scripts that start with a certain prefix. Repetition of this flag is allowed. Ignored with -n'
      )
        .argParser((value, previous: string[] = []) => {
          previous.push(value);
          return previous;
        })
        .default([])
    )

    .addHelpText(
      'after',
      'Availble script types: \n' +
        'AUTHENTICATION_TREE_DECISION_NODE\n' +
        'SAML2_SP_ADAPTER\n' +
        'OAUTH2_ACCESS_TOKEN_MODIFICATION\n' +
        'Scripted Decision Node\n' +
        'AUTHENTICATION_CLIENT_SIDE\n' +
        'DEVICE_MATCH_NODE\n' +
        'OAUTH2_SCRIPTED_JWT_ISSUER\n' +
        'AUTHENTICATION_SERVER_SIDE\n' +
        'SOCIAL_IDP_PROFILE_TRANSFORMATION\n' +
        'CONFIG_PROVIDER_NODE\n' +
        'OAUTH2_VALIDATE_SCOPE\n' +
        'LIBRARY\n' +
        'OAUTH2_AUTHORIZE_ENDPOINT_DATA_PROVIDER\n' +
        'OAUTH2_EVALUATE_SCOPE\n' +
        'POLICY_CONDITION\n' +
        'OIDC_CLAIMS\n' +
        'SAML2_IDP_ADAPTER\n' +
        'PingOne Verify Completion Decision Node\n' +
        'SAML2_NAMEID_MAPPER\n' +
        'SAML2_IDP_ATTRIBUTE_MAPPER\n' +
        'CONFIG_PROVIDER_NODE\n' +
        'OAUTH2_MAY_ACT'
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
        let outcome: boolean;
        printMessage(
          options.scriptName
            ? `Exporting script "${options.scriptName}".`
            : 'Exporting scripts'
        );
        outcome = await configManagerExportScripts(
          options.prefix,
          realm,
          options.scriptName
        );
        if (!outcome) process.exitCode = 1;
      } else {
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
