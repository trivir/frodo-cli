import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';
import path from 'path';

import { printError, printMessage } from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const {
  readSecretStoreMappings,
  updateSecretStoreMapping,
  deleteSecretStoreMapping,
} = frodo.secretStore;

const constants = frodo.utils.constants;
const { DEFAULT_REALM_KEY } = constants;

const ESV_SECRET_STORE_ID = 'ESV';
const ESV_SECRET_STORE_TYPE = 'GoogleSecretManagerSecretStoreProvider';
export async function configManagerExportSecretMappings(
  name?,
  realm?
): Promise<boolean> {
  try {
    const realms =
      realm && realm !== DEFAULT_REALM_KEY ? [realm] : await realmList();
    for (const realm of realms) {
      if (realm === '/') continue;
      state.setRealm(realm);
      const readData = await readSecretStoreMappings(
        ESV_SECRET_STORE_ID,
        ESV_SECRET_STORE_TYPE,
        false
      );
      processSecretMappings(readData, `realms/${realm}/secret-mappings`, name);
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
 * Import all secret-mappings for ESV secret store
 * @param {string} name the name of the mapping to import
 * @param {string} realm the name of the realm to import to
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerImportSecretMappings(
  name?: string,
  realm?: string
): Promise<boolean> {
  try {
    const realms =
      realm && realm !== DEFAULT_REALM_KEY ? [realm] : await realmList();

    for (const realm of realms) {
      if (realm === '/') continue;

      state.setRealm(realm);

      const dir = getFilePath(`realms/${realm}/secret-mappings/`);
      if (!fs.existsSync(dir)) continue;

      const configFiles = fs
        .readdirSync(dir)
        .filter((f) => path.extname(f) === '.json');

      for (const configFile of configFiles) {
        const importData = JSON.parse(
          fs.readFileSync(path.join(dir, configFile), 'utf8')
        );

        if (name && name !== importData._id) continue;

        delete importData._rev;

        await updateSecretStoreMapping(
          ESV_SECRET_STORE_ID,
          ESV_SECRET_STORE_TYPE,
          importData,
          false
        );
      }
    }
    return true;
  } catch (error) {
    printError(error, `Error importing secret mappings`);
    return false;
  }
}

/**
 * Delete secret mappings from the ESV secret store.
 * @param name exact mapping ID to delete; omit to delete all mappings
 * @param realm realm to target; omit to process non-root realms
 * @param dryRun log selected mappings without deleting them
 * @returns true if successful, false otherwise
 */
export async function configManagerDeleteSecretMappings(
  name?: string,
  realm?: string,
  dryRun = false
): Promise<boolean> {
  let success = true;
  try {
    const realms =
      realm && realm !== DEFAULT_REALM_KEY ? [realm] : await realmList();
    for (const realm of realms) {
      if (realm === '/') continue;
      state.setRealm(realm);
      try {
        const mappings = await readSecretStoreMappings(
          ESV_SECRET_STORE_ID,
          ESV_SECRET_STORE_TYPE,
          false
        );
        const selectedMappings = mappings.filter(
          (mapping) => !name || mapping._id === name
        );
        if (selectedMappings.length === 0) {
          if (name) {
            printMessage(
              `Warning: Secret mapping with ID '${name}' not found in realm '${realm}'.`,
              'warn'
            );
            success = false;
          } else {
            printMessage(
              `No secret mappings found to delete in realm '${realm}'.`
            );
          }
          continue;
        }
        for (const mapping of selectedMappings) {
          if (dryRun) {
            printMessage(
              `Dry run: Deleting secret ID mapping: ${mapping._id} in realm '${realm}'`
            );
            continue;
          }
          try {
            await deleteSecretStoreMapping(
              ESV_SECRET_STORE_ID,
              ESV_SECRET_STORE_TYPE,
              mapping._id,
              false
            );
            printMessage(
              `Deleted secret ID mapping: ${mapping._id} in realm '${realm}'`
            );
          } catch (error) {
            printError(
              error,
              `Error processing secret mappings in realm '${realm}'`
            );
            success = false;
          }
        }
      } catch (error) {
        printError(
          error,
          `Error processing secret mappings in realm '${realm}'`
        );
        success = false;
      }
    }
  } catch (error) {
    printError(error, 'Error deleting secret mappings');
    return false;
  }
  return success;
}
