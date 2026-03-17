import { frodo, state } from '@rockcarver/frodo-lib';
import { AuthenticationSettingsExportInterface } from '@rockcarver/frodo-lib/types/ops/AuthenticationSettingsOps';
import fs from 'fs';

import { printError } from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const {
  readAuthenticationSettings: _readAuthenticationSettings,
  importAuthenticationSettings,
} = frodo.authn.settings;
const { getFilePath, saveJsonToFile } = frodo.utils;

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
      saveJsonToFile(exportData, getFilePath(`${fileName}`, true), false, true);
    } else {
      for (const realmName of await realmList()) {
        state.setRealm(realmName);
        const exportData = await _readAuthenticationSettings(false);
        const fileName = `realms/${realmName}/realm-config/authentication.json`;
        saveJsonToFile(
          exportData,
          getFilePath(`${fileName}`, true),
          false,
          true
        );
      }
    }

    return true;
  } catch (error) {
    printError(error, `Error exporting config entity ui-configuration`);
  }
  return false;
}

/**
 * Import an Authentication configuration object in the fr-config-manager format.
 * @param {string} realm Flag that defines the realm the user intends to push to
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportAuthentication(
  realm?: string
): Promise<boolean> {
  try {
    const targetRealm = (realm || state.getRealm())?.trim();
    if (!targetRealm || targetRealm === '__default__realm__') {
      return true;
    }
    const filePath = getFilePath(
      `realms/${targetRealm}/realm-config/authentication.json`
    );
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const authData = JSON.parse(fileContent);
    delete authData._rev;

    const importData: AuthenticationSettingsExportInterface = {
      authentication: authData,
    };
    await importAuthenticationSettings(importData, false);
    return true;
  } catch (error) {
    printError(error, `Error importing authentication settings`);
  }
  return false;
}
