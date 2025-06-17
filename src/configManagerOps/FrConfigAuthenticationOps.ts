import { frodo, state } from '@rockcarver/frodo-lib';

import { printError } from '../utils/Console';
<<<<<<< HEAD
=======
import { realmList } from './FrConfigOps';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd

const { readAuthenticationSettings: _readAuthenticationSettings } =
  frodo.authn.settings;
const { getFilePath, saveJsonToFile } = frodo.utils;
<<<<<<< HEAD
const { readRealms } = frodo.realm;
=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd

/**
 * Export an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportAuthentication(
  realm?: string
): Promise<boolean> {
  try {
    if (realm && realm !== '__default__realm__') {
      const exportData = await _readAuthenticationSettings(false);
      const fileName = `realms/${state.getRealm()}/realm-config/authentication.json`;
      saveJsonToFile(
        exportData,
        getFilePath(`${fileName}`, true),
        false,
        false
      );
    } else {
      for (const realmName of await realmList()) {
        state.setRealm(realmName);
        const exportData = await _readAuthenticationSettings(false);
        const fileName = `realms/${realmName}/realm-config/authentication.json`;
        saveJsonToFile(
          exportData,
          getFilePath(`${fileName}`, true),
          false,
          false
        );
      }
    }

    return true;
  } catch (error) {
    printError(error, `Error exporting config entity ui-configuration`);
  }
  return false;
<<<<<<< HEAD
}
async function realmList(): Promise<string[]> {
  const realms = await readRealms();
  const realmList = [];
  realms.forEach((realmConfig) => {
    realmList.push(`${realmConfig.name}`);
  });
  return realmList;
=======
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
}
