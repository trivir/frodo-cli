import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { readSecretStoreMappings, updateSecretStoreMapping } = frodo.secretStore;

const ESV_SECRET_STORE_ID = 'ESV';
const ESV_SECRET_STORE_TYPE = 'GoogleSecretManagerSecretStoreProvider';
export async function configManagerExportSecretMappings(
  name?,
  realm?
): Promise<boolean> {
  try {
    if (realm && realm !== '__default__realm__') {
      const readData = await readSecretStoreMappings(
        ESV_SECRET_STORE_ID,
        ESV_SECRET_STORE_TYPE,
        false
      );
      processSecretMappings(readData, `realms/${realm}/secret-mappings`, name);
    } else {
      for (const realm of await realmList()) {
        if (
          realm === '/' &&
          state.getDeploymentType() ===
            frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
        )
          continue;
        const readData = await readSecretStoreMappings(
          ESV_SECRET_STORE_ID,
          ESV_SECRET_STORE_TYPE,
          false
        );
        processSecretMappings(
          readData,
          `realms/${realm}/secret-mappings`,
          name
        );
      }
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity endpoints`);
  }
  return false;
}

async function processSecretMappings(mappings, targetDir, name) {
  try {
    for (const mapping of mappings) {
      if (
        name &&
        !(await aliasSearch(mapping.aliases, name)) &&
        name !== mapping._id
      ) {
        continue;
      }
      const fileName = `${targetDir}/${mapping._id}.json`;
      saveJsonToFile(mapping, getFilePath(fileName, true), false, true);
    }
  } catch (err) {
    printError(err);
  }
}

async function aliasSearch(object, name) {
  if (object.includes(name)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Import all secrets to individual files in fr-config-manager format
 * @param {string} name the name of the file to be imported
 * @param {string} realm the name of teh specified realm to import to
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerImportSecretMappings(
  name?: string,
  realm?: string
): Promise<boolean> {
  try {
    if (realm && name) {
      state.setRealm(realm);
      const filePath = getFilePath(
        `realms/${realm}/secret-mappings/${name}.json`
      );
      const readFile = fs.readFileSync(filePath, 'utf8');
      const importData = JSON.parse(readFile);
      await updateSecretStoreMapping(
        ESV_SECRET_STORE_ID,
        ESV_SECRET_STORE_TYPE,
        importData,
        false
      );
      saveJsonToFile(importData, 'name-realm-test.json');
    } else if (realm && realm !== '/') {
      state.setRealm(realm);
      const filePath = getFilePath(`realms/${realm}/secret-mappings/`);
      if (fs.existsSync(filePath)) {
        const readDir = fs.readdirSync(filePath, 'utf8');
        for (const fileName of readDir) {
          const fullPath = `${filePath}${fileName}`;
          const readFile = fs.readFileSync(fullPath, 'utf8');
          const importData = JSON.parse(readFile);
          await updateSecretStoreMapping(
            ESV_SECRET_STORE_ID,
            ESV_SECRET_STORE_TYPE,
            importData,
            false
          );
          saveJsonToFile(importData, 'realm-test.json');
        }
      }
    } else {
      for (const realmName of await realmList()) {
        if (
          realmName === '/' &&
          state.getDeploymentType() ===
            frodo.utils.constants.CLOUD_DEPLOYMENT_TYPE_KEY
        )
          continue;
        state.setRealm(realmName);
        const filePath = getFilePath(`realms/${realmName}/secret-mappings/`);
        if (!fs.existsSync(filePath)) continue;
        const readDir = fs.readdirSync(filePath, 'utf8');
        for (const fileName of readDir) {
          const fullPath = `${filePath}${fileName}`;
          const readFile = fs.readFileSync(fullPath, 'utf8');
          const importData = JSON.parse(readFile);
          await updateSecretStoreMapping(
            ESV_SECRET_STORE_ID,
            ESV_SECRET_STORE_TYPE,
            importData,
            false
          );
          saveJsonToFile(importData, 'test.json');
        }
      }
    }
    return true;
  } catch (error) {
    printError(error, `Error importing secret mappings`);
    return false;
  }
}
