import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  configManagerImportAuthzPoliciesAll,
  configManagerImportAuthzPolicySet,
  configManagerImportAuthzPolicySetsRealm,
} from '../../../configManagerOps/FrConfigAuthzPoliciesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];
const { constants } = frodo.utils;
const { readRealms } = frodo.realm;

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push authz-policies',
    deploymentTypes
  );

  program
    .description('Import authorization policies from realm.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to import from. Only policy sets from this realm will be imported.'
      )
    )
    .addOption(
      new Option(
        '-n, --policy-name <policy-set-name>',
        'Import only a specific policy set with the name.'
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

      // -r/--realm flag has precedence over [realm] arguement
      if (options.realm) {
        realm = options.realm;
      }

      if (await getTokens(false, true, deploymentTypes)) {
        let outcome: boolean;

        // -p/--p-set
        if (options.policyName) {
          printMessage(
            `importing the policy set "${options.policyName}" in the ${state.getRealm()} realm.`
          );

          // try and find script in current realm
          outcome = await configManagerImportAuthzPolicySet(options.policyName);

          // check other realms for the script but only if there is no config file specified
          if (!outcome && !options.file) {
            const checkedRealms: string[] = [state.getRealm()];
            for (const realm of await readRealms()) {
              if (outcome) {
                break;
              }
              if (!checkedRealms.includes(realm.name)) {
                printMessage(
                  `importing the policy set "${options.policyName}" from the ${checkedRealms[checkedRealms.length - 1]} realm failed.`
                );
                state.setRealm(realm.name);
                checkedRealms.push(state.getRealm());
                printMessage(
                  `Looking for the policy set "${options.policyName}" in the ${state.getRealm()} realm now.`
                );
                outcome = await configManagerImportAuthzPolicySet(
                  options.policyName
                );
              }
            }
            if (!outcome) {
              printMessage(
                `Did not find the policy set "${options.policyName}" anywhere.`
              );
            }
          }
        }

        // -r/--realm
        else if (realm !== constants.DEFAULT_REALM_KEY) {
          printMessage(
            `importing all the policy sets in the ${state.getRealm()} realm.`
          );
          outcome = await configManagerImportAuthzPolicySetsRealm(
            options.realm
          );
        }

        // import all policy sets from all realms, the default when no options are provided
        else {
          printMessage('importing all the policy sets in the host tenant.');
          outcome = await configManagerImportAuthzPoliciesAll();
        }

        if (!outcome) {
          printMessage(
            `Failed to import one or more authorization policy sets. ${options.verbose ? '' : 'Check --verbose for me details.'}`
          );
          process.exitCode = 1;
        }
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
