import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportAuthzPolicySets } from '../../../configManagerOps/FrConfigAuthzPoliciesOps';
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
    'frodo config-manager pull authz-policies',
    deploymentTypes
  );

  program
    .description('Export authorization policies from realm.')
    .addOption(
      new Option(
        '-f, --file <file>',
        '*Required* The AUTHZ_POLICY_SETS_CONFIG json file. ex: "/Documents/policy-sets.json"'
      )
    )
    .addHelpText(
      'after',
      'HELP MESSAGE:\n' +
        'Make sure to create the export config file: authz-policies.json to run this command.\n' +
        'Example command: frodo config-manager pull authz-policies -f authz-policies.json -D ../testDir frodo-dev\n\n' +
        `Config file example:\n` +
        '-----------------------  Example authz policies export config for authz-policies.json file ------------------------\n' +
        '{\n' +
        ' "alpha": [ \n' +
        '   "oauth2Scopes", \n' +
        '   "EdgePolicySet",\n' +
        '   "FeatureStorePolicySet",\n' +
        '   "data",\n' +
        '   "test-policy-set"\n' +
        ' ],\n' +
        ' "bravo": [\n' +
        '   "oauth2Scopes",\n' +
        '   "murphyTestPolicySet"\n' +
        '   ]\n' +
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
        printMessage(`Exporting all policy sets in the provided config file.`);
        const outcome = await configManagerExportAuthzPolicySets(options.file);
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
