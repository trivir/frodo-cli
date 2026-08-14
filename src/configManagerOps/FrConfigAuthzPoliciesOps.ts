import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError, verboseMessage } from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { policySet, resourceType, policy } = frodo.authz;

/**
 * Export policy sets for all realms
 * @param {string} configFile required reference file for what sets to export
 * @returns {Promise<boolean>} return true if export succesful, false otherwise
 */
export async function configManagerExportAuthzPolicySets(
  configFile: string
): Promise<boolean> {
  try {
    const policySets = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    for (const realm of Object.keys(policySets)) {
      for (const set of policySets[realm]) {
        state.setRealm(realm);
        verboseMessage(`\n${state.getRealm()} realm:`);

        const policyConfig = await policySet.readPolicySet(set);
        policyConfig._id = policyConfig.name;
        const targetDir = `realms/${state.getRealm()}/authorization/policy-sets/${policyConfig.name}`;
        saveJsonToFile(
          policyConfig,
          getFilePath(`${targetDir}/${policyConfig.name}.json`, true),
          false,
          false,
          true
        );

        const singlePolicy = await policy.readPoliciesByPolicySet(
          policyConfig.name
        );
        for (const p of singlePolicy) {
          saveJsonToFile(
            singlePolicy,
            getFilePath(`${targetDir}/policies/${p.name}.json`, true)
          );
          if (p.resourceTypeUuid != undefined) {
            const policyResourceType = await resourceType.readResourceTypes();
            for (const rt of policyResourceType) {
              saveJsonToFile(
                policyResourceType,
                getFilePath(
                  `realms/${state.getRealm()}/authorization/resource-types/${rt.name}.json`,
                  true
                ),
                false,
                false,
                true
              );
            }
          }
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
