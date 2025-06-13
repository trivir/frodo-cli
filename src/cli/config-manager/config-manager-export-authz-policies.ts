import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  exportAllAuthzPolicies,
  exportAuthzPolicySet,
  exportConfigAuthzPolicySets,
  exportRealmAuthzPolicySets,
} from '../../configManagerOps/FrConfigAuthzPoliciesOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud'];
const { constants } = frodo.utils;
const { readRealms } = frodo.realm;

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export authz-policies',
    deploymentTypes
  );

  program
    .description('Export authorization policies from realm.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to export from. Only policy sets from this realm will be exported. Ignored with -f'
      )
    )
    .addOption(
      new Option(
        '-p, --p-set <policy-set-id>',
        'Get only a specific policy set.'
      )
    )
    /**
     * added because fr-config manager needs a config in order to complete the "fr-config-pull authz-policies" command. Bryan said this should still be supported  
     *   
     * -----------------------  Example AUTHZ_POLICY_SETS_CONFIG json file ------------------------
     {
       "alpha": [
         "oauth2Scopes",
         "EdgePolicySet",
         "FeatureStorePolicySet",
         "data",
         "test-policy-set"
       ],
       "bravo": [
         "oauth2Scopes",
         "murphyTestPolicySet"
       ]
     }
     * -------------------------------------------------------------------------------------------- 
     */
    .addOption(
      new Option(
        '-f, --file <file>',
        'The AUTHZ_POLICY_SETS_CONFIG json file. ex: "/home/trivir/Documents/policy-sets.json", or "policy-sets.json"'
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
        if (options.pSet) {
          printMessage(
            `Exporting the policy set "${options.pSet}" in the ${state.getRealm()} realm.`
          );

          // try and find script in current realm
          outcome = await exportAuthzPolicySet(
            {
              policySetName: options.pSet,
            },
            options.file
          );

          // check other realms for the script but only if there is no config file specified
          if (!outcome && !options.file) {
            const checkedRealms: string[] = [state.getRealm()];
            for (const realm of await readRealms()) {
              if (outcome) {
                break;
              }
              if (!checkedRealms.includes(realm.name)) {
                printMessage(
                  `Exporting the policy set "${options.pSet}" from the ${checkedRealms[checkedRealms.length - 1]} realm failed.`
                );
                state.setRealm(realm.name);
                checkedRealms.push(state.getRealm());
                printMessage(
                  `Looking for the policy set "${options.pSet}" in the ${state.getRealm()} realm now.`
                );
                outcome = await exportAuthzPolicySet(
                  {
                    policySetName: options.scriptName,
                  },
                  null
                );
              }
            }
            if (!outcome) {
              printMessage(
                `Did not find the policy set "${options.pSet}" anywhere.`
              );
            }
          }
        }

        // -f/--file
        else if (options.file) {
          printMessage(
            `Exporting all the policy sets in the provided config file.`
          );
          outcome = await exportConfigAuthzPolicySets(options.file);
        }

        // -r/--realm
        else if (realm !== constants.DEFAULT_REALM_KEY) {
          printMessage(
            `Exporting all the policy sets in the ${state.getRealm()} realm.`
          );
          outcome = await exportRealmAuthzPolicySets();
        }

        // export all policy sets from all realms, the default when no options are provided
        else {
          printMessage('Exporting all the policy sets in the host tenant.');
          outcome = await exportAllAuthzPolicies();
        }

        if (!outcome) {
          printMessage(
            `Failed to export one or more authorization policy sets. ${options.verbose ? '' : 'Check --verbose for me details.'}`
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
