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
    if (realm && realm !== '__default__realm__') {
      indicatorId = createProgressIndicator(
        'indeterminate',
        0,
        `Exporting secret mappings (${realm})`
      );
      const readData = await readSecretStoreMappings(
        'ESV',
        'GoogleSecretManagerSecretStoreProvider',
        false
      );
      const mappingsToExport = readData.filter((mapping) => {
        if (!name) return true;
        return mapping._id === name || (mapping.aliases || []).includes(name);
      });
      stopProgressIndicator(indicatorId);
      indicatorId = createProgressIndicator(
        'determinate',
        mappingsToExport.length,
        `Exporting secret mappings (${realm})`
      );
      await processSecretMappings(
        mappingsToExport,
        `realms/${realm}/secret-mappings`,
        name,
        indicatorId
      );
      stopProgressIndicator(
        indicatorId,
        `${mappingsToExport.length} secret mappings exported`
      );
    } else {
      const realms = await realmList();
      indicatorId = createProgressIndicator(
        'determinate',
        realms.length,
        'Exporting secret mappings'
      );
      for (const realmName of realms) {
        state.setRealm(realmName);
        updateProgressIndicator(
          indicatorId,
          `Exporting secret mappings (${realmName})`
        );
        const readData = await readSecretStoreMappings(
          'ESV',
          'GoogleSecretManagerSecretStoreProvider',
          false
        );
        const mappingsToExport = readData.filter((mapping) => {
          if (!name) return true;
          return mapping._id === name || (mapping.aliases || []).includes(name);
        });
        await processSecretMappings(
          mappingsToExport,
          `realms/${realmName}/secret-mappings`,
          name
        );
      }
      stopProgressIndicator(indicatorId, 'Exported secret mappings');
    }
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting secret mappings',
        'fail'
      );
    }
    printError(error, `Error exporting config entity endpoints`);
  }
  return false;
}

async function processSecretMappings(
  mappings,
  targetDir,
  name,
  indicatorId?: string
) {
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
      if (indicatorId) {
        updateProgressIndicator(
          indicatorId,
          `Exporting secret mapping ${mapping._id}`
        );
      }
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
