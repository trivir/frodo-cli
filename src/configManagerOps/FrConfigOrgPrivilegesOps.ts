import fs from 'fs';
import {
  frodo,
  state,
  type IdObjectSkeletonInterface,
} from '@rockcarver/frodo-lib';
import { printError } from '../utils/Console';
import path from 'path';

const { config } = frodo.idm;
const { getFilePath, saveJsonToFile, getWorkingDirectory } = frodo.utils;
const { importConfigEntities } = frodo.idm.config;
const { readRealms } = frodo.realm;

/**
 * Export the privileges assignments configuration in fr-config manager format
 * @param {string} name The name of the organization privilege to export
 * @returns True if privilegeAssignments was successfully saved
 */
export async function configManagerExportOrgPrivileges(
  name?: string
): Promise<boolean> {
  try {
    if (name) {
      const entity = await config.readConfigEntity(name);
      saveJsonToFile(entity, getFilePath(`org-privileges/${name}.json`, true));
      return true;
    }
    const assignments: IdObjectSkeletonInterface =
      await config.readConfigEntity('privilegeAssignments');
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
        realm.name === '/' &&
        state.getDeploymentType() ===
          frodo.utils.constants.FORGEOPS_DEPLOYMENT_TYPE_KEY
      ) {
        saveJsonToFile(
          await config.readConfigEntity('privileges'),
          getFilePath('org-privileges/privileges.json', true),
          false,
          false
        );
        continue;
      }
      state.setRealm(realm.name);
      const realmPrivileges = await config.readConfigEntity(
        `${realm.name}OrgPrivileges`
      );
      saveJsonToFile(
        realmPrivileges,
        getFilePath(`org-privileges/${realm.name}OrgPrivileges.json`, true),
        false,
        false
      );
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import organization privileges by name or import all organization privileges
 * and privilege assignments in fr-config manager format.
 * @param name Optional name of the organization privileges file to import
 * @returns True if all selected configurations were successfully imported
 */
export async function configManagerImportOrgPrivileges(
  name?: string
): Promise<boolean> {
  try {
    const dir = path.join(getWorkingDirectory(), 'org-privileges');

    const fileNames = fs
      .readdirSync(dir)
      .filter((fileName) => path.extname(fileName) === '.json')
      .filter((fileName) => !name || path.parse(fileName).name === name);

    for (const fileName of fileNames) {
      const filePath = path.join(dir, fileName);
      const orgConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const importData = { idm: { [orgConfig._id]: orgConfig } };
      await importConfigEntities(importData);
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}