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
// export async function configManagerImportOrgPrivilegesAllRealms(): Promise<boolean> {
//   try {
//     await configManagerImportOrgPrivilegeAssignments();
//     for (const realm of await readRealms()) {
//       // fr-config-manager doesn't support root org privileges
//       if (realm.name === '/') continue;
//       state.setRealm(realm.name);
//       if (!(await configManagerImportOrgPrivilegesRealm(realm.name))) {
//         return false;
//       }
//     }
//     return true;
//   } catch (error) {
//     printError(error);
//     return false;
//   }
// }

export async function configManagerImportOrgPrivileges(name: string): Promise<boolean> {
  try {
    // console.log(name);
    // let fileNames = fs.readdirSync(`${getWorkingDirectory()}/org-privileges`);
    // console.log("\nCurrent directory filenames:\n")
    // fileNames.forEach(file => {
    //   console.log(file);
    // })

    const dir = `${getWorkingDirectory()}/org-privileges`;
    const orgConfigs = fs
      .readdirSync(`${dir}`)
      .filter((name) => path.extname(name) === ".json")
      .map((filename) =>
          JSON.parse(fs.readFileSync(path.join(dir, filename), 'utf-8'))
        );
    
    console.log("\n\n", orgConfigs);
    for (const orgConfig of orgConfigs) {
      if (name && name !== orgConfig._id) continue;
      console.log(`\n\nSingle orgConfig: ${JSON.stringify(orgConfig, null, 2)}`)
      const importData = { idm: { [orgConfig._id]: orgConfig } };
      await importConfigEntities(importData);
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