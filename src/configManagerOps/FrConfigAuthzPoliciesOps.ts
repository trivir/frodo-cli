import { frodo, state } from '@rockcarver/frodo-lib';
import { PolicySetExportInterface } from '@rockcarver/frodo-lib/types/ops/PolicySetOps';
import fs from 'fs';

import { printError, verboseMessage } from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { policySet, policy, resourceType } = frodo.authz;
const { importPolicySets } = frodo.authz.policySet;
const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

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
            p,
            getFilePath(`${targetDir}/policies/${p.name}.json`, true)
          );

          if (p.resourceTypeUuid != undefined) {
            const policyResourceType = await resourceType.readResourceTypes();

            for (const rt of policyResourceType) {
              saveJsonToFile(
                rt,
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

/**
 * Import authz policy sets
 * @returns {Promise<boolean>} true if all imports were successful
 */
export async function configManagerImportAuthzPolicies(): Promise<boolean> {
  try {
    const realmsDir = getFilePath('realms/');
    const realmDirs = fs
      .readdirSync(realmsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const realmDir of realmDirs) {
      // 'root' on disk maps to the actual root realm name '/'
      state.setRealm(realmDir === 'root' ? '/' : realmDir);
      if (
        state.getRealm() === '/' &&
        state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY
      ) {
        continue;
      }
      const realmAuthzDir = `realms/${realmDir}/authorization`;

      const policySetsDir = getFilePath(`${realmAuthzDir}/policy-sets`);
      const psDirs = fs.existsSync(policySetsDir)
        ? fs.readdirSync(policySetsDir)
        : [];

      const policyset: Record<string, any> = {};
      const policyMap: Record<string, any> = {};

      for (const psDir of psDirs) {
        const psFilePath = `${policySetsDir}/${psDir}/${psDir}.json`;
        const psData = JSON.parse(fs.readFileSync(psFilePath, 'utf8'));
        policyset[psData.name] = psData;

        const policiesDir = `${policySetsDir}/${psDir}/policies`;
        const policyFiles = fs.existsSync(policiesDir)
          ? fs.readdirSync(policiesDir)
          : [];

        for (const file of policyFiles) {
          if (file.endsWith('.json')) {
            const pData = JSON.parse(
              fs.readFileSync(`${policiesDir}/${file}`, 'utf8')
            );
            policyMap[pData.name] = pData;
          }
        }
      }

      const resourcetype: Record<string, any> = {};
      const resourceTypesDir = getFilePath(`${realmAuthzDir}/resource-types`);
      if (fs.existsSync(resourceTypesDir)) {
        for (const file of fs.readdirSync(resourceTypesDir)) {
          if (file.endsWith('.json')) {
            const rtData = JSON.parse(
              fs.readFileSync(`${resourceTypesDir}/${file}`, 'utf8')
            );
            resourcetype[rtData.uuid] = rtData;
          }
        }
      }

      const importData: PolicySetExportInterface = {
        script: {},
        resourcetype,
        policy: policyMap,
        policyset,
      };

      await importPolicySets(importData, {
        deps: false,
        prereqs: false,
      });
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
