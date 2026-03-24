import { frodo, state } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { readSecretStoreMappings, importSecretStores } = frodo.secretStore;

export async function configManagerExportSecretMappings(
  name?,
  realm?
): Promise<boolean> {
  try {
    if (realm && realm !== '__default__realm__') {
      const readData = await readSecretStoreMappings(
        'ESV',
        'GoogleSecretManagerSecretStoreProvider',
        false
      );
      processSecretMappings(readData, `realms/${realm}/secret-mappings`, name);
    } else {
      for (const realm of await realmList()) {
        // fr-config-manager doesn't support root secret-mappings
        if (realm === '/') continue;
        state.setRealm(realm);
        const readData = await readSecretStoreMappings(
          'ESV',
          'GoogleSecretManagerSecretStoreProvider',
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

export async function configManagerImportSecretMappings(
  name?: string,
  realm?: string
): Promise<boolean> {
  try {
    if (realm && realm !== '__default__realm__' && name) {
      const filePath = getFilePath(
        `realms/${realm}/secret-mappings/${name}.json`
      );
      const readFile = fs.readFileSync(filePath, 'utf8');
      const importData = JSON.parse(readFile);
      const mappingData = { secretstore: { [importData._id]: importData } };
      await importSecretStores(mappingData, false, importData._id);
    } else {
      for (const realmName of await realmList()) {
        // fr-config-manager doesn't support root secret-mappingsgit 
        if (realmName === '/') continue;
        const filePath = getFilePath(`realms/${realmName}/secret-mappings/`);
        if (!fs.existsSync(filePath)) continue;
        const readDir = fs.readdirSync(filePath, 'utf8');
        for (const fileName of readDir) {
          const fullPath = `${filePath}/${fileName}`;
          const readFile = fs.readFileSync(fullPath, 'utf8');
          const importData = JSON.parse(readFile);
          const mappingData = { secretstore: { [importData._id]: importData } };

          await importSecretStores(mappingData, false, importData._id);
        }
      }
    }
    return true;
  } catch (error) {
    printError(error, `Error importing secret mappings`);
    return false;
  }
}
