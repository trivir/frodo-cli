import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';

const { config } = frodo.idm;
const { getFilePath, saveJsonToFile } = frodo.utils;
const { importConfigEntities } = frodo.idm.config;
const { readRealms } = frodo.realm;

/**
 * Export all organization privileges configurations from all realms in fr-config manager format. In case the name param is provided, will export only the specified config.
 * @param {string} name org-privilege name
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function configManagerExportOrgPrivileges(
  name?: string
): Promise<boolean> {
  try {
    if (name) {
      const entity = await config.readConfigEntity(name);
      saveJsonToFile(entity, getFilePath(`org-privileges/${name}.json`, true));
    } else {
      const assignments = await config.readConfigEntity('privilegeAssignments');
      saveJsonToFile(
        assignments,
        getFilePath('org-privileges/privilegeAssignments.json', true),
        false,
        false
      );

      for (const realm of await readRealms()) {
        if (
          realm.name === '/' &&
          state.getDeploymentType() ===
            frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
        )
          continue;
        if (
          state.getDeploymentType() ===
          frodo.utils.constants.FORGEOPS_DEPLOYMENT_TYPE_KEY
        ) {
          saveJsonToFile(
            await config.readConfigEntity('privileges'),
            getFilePath('org-privileges/privileges.json', true),
            false,
            true
          );
        }
        state.setRealm(realm.name);
        const realmPrivileges = await config.readConfigEntity(
          `${realm.name}OrgPrivileges`
        );
        saveJsonToFile(
          realmPrivileges,
          getFilePath(`org-privileges/${realm.name}OrgPrivileges.json`, true),
          false,
          true
        );
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import organization privileges from a file
 * @param filePath The path to the organization privileges file to import
 * @returns True if the file was successfully imported
 */
async function importOrgPrivilegesFromFile(filePath: string): Promise<boolean> {
  try {
    const mainFile = fs.readFileSync(filePath, 'utf-8');
    let importData = JSON.parse(mainFile);
    const id = importData._id;
    importData = { idm: { [id]: importData } };
    await importConfigEntities(importData);
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import organization privileges for a specific realm in fr-config manager format
 * @param realm The name of the realm to import organization privileges for
 * @returns True if organization privileges were successfully imported
 */
export async function configManagerImportOrgPrivilegesRealm(
  realm: string
): Promise<boolean> {
  return importOrgPrivilegesFromFile(
    getFilePath(`org-privileges/${realm}OrgPrivileges.json`)
  );
}

/**
 * Import organization privileges by name in fr-config manager format
 * @param name The name of the organization privileges file to import
 * @returns True if organization privileges were successfully imported
 */
export async function configManagerImportOrgPrivilegesByName(
  name: string
): Promise<boolean> {
  return importOrgPrivilegesFromFile(
    getFilePath(`org-privileges/${name}.json`)
  );
}

/**
 * Import the privilege assignments configuration in fr-config manager format
 * @returns True if privilegeAssignments was successfully imported
 */
export async function configManagerImportOrgPrivilegeAssignments(): Promise<boolean> {
  return importOrgPrivilegesFromFile(
    getFilePath('org-privileges/privilegeAssignments.json')
  );
}

/**
 * Import privilege assignments and all per-realm organization privileges configurations in fr-config manager format
 * @returns True if all configurations were successfully imported
 */
export async function configManagerImportOrgPrivilegesAllRealms(): Promise<boolean> {
  try {
    await configManagerImportOrgPrivilegeAssignments();
    for (const realm of await readRealms()) {
      // fr-config-manager doesn't support root org privileges
      if (realm.name === '/') continue;
      state.setRealm(realm.name);
      if (!(await configManagerImportOrgPrivilegesRealm(realm.name))) {
        return false;
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
