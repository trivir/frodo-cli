import { frodo, state } from '@rockcarver/frodo-lib';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';
import { realmList } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { readSecretStoreMappings } = frodo.secretStore;

export async function configManagerExportSecretMappings(
  name?,
  realm?
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting secret mappings'
    );
    if (realm && realm !== '__default__realm__') {
      const readData = await readSecretStoreMappings(
        'ESV',
        'GoogleSecretManagerSecretStoreProvider',
        false
      );
      updateProgressIndicator(
        indicatorId,
        `Exporting secret mappings (${realm})`
      );
      processSecretMappings(readData, `realms/${realm}/secret-mappings`, name);
    } else {
      for (const realm of await realmList()) {
        state.setRealm(realm);
        updateProgressIndicator(
          indicatorId,
          `Exporting secret mappings (${realm})`
        );
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
    stopProgressIndicator(indicatorId, 'Exported secret mappings');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting secret mappings',
        'fail'
      );
    }
    printError(error, `Error exporting secret mappings`);
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
