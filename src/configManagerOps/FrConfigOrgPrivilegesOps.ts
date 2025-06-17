import { frodo, state } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';

import { printError } from '../utils/Console';

const { config } = frodo.idm;
const { getFilePath, saveJsonToFile } = frodo.utils;
const { readRealms } = frodo.realm;

/**
 *
 * @param realm The name of the realm to retrieve organization privileges from.
 * @returns True if realm exists and organization privileges configuration file was successfully saved
 */
<<<<<<< HEAD
export async function configManagerExportOrgPrivilegesRealm(
=======
export async function exportOrgPrivilegesRealm(
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  realm: string
): Promise<boolean> {
  try {
    const realmPrivileges: IdObjectSkeletonInterface =
      await config.readConfigEntity(`${realm}OrgPrivileges`);
    saveJsonToFile(
      realmPrivileges,
      getFilePath(`org-privileges/${realm}OrgPrivileges.json`, true),
      false,
      false
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Export the privileges assignments configuration in fr-config manager format
 * @returns True if privilegeAssignments was successfully saved
 */
<<<<<<< HEAD
export async function configManagerExportOrgPrivileges(): Promise<boolean> {
=======
export async function exportOrgPrivileges(): Promise<boolean> {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  try {
    const orgPrivileges: IdObjectSkeletonInterface =
      await config.readConfigEntity('privilegeAssignments');
    saveJsonToFile(
      orgPrivileges,
      getFilePath('org-privileges/privilegeAssignments.json', true),
      false,
      false
    );
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Export all organization privileges configurations from all realms in fr-config manager format
 * @returns True if configuration files were successfully saved
 */
<<<<<<< HEAD
export async function configManagerExportOrgPrivilegesAllRealms(): Promise<boolean> {
  try {
    configManagerExportOrgPrivileges();
    for (const realm of await readRealms()) {
      state.setRealm(realm.name);
      if (!(await configManagerExportOrgPrivilegesRealm(realm.name))) {
=======
export async function exportOrgPrivilegesAllRealms(): Promise<boolean> {
  try {
    exportOrgPrivileges();
    for (const realm of await readRealms()) {
      state.setRealm(realm.name);
      if (!(await exportOrgPrivilegesRealm(realm.name))) {
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
        return false;
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
