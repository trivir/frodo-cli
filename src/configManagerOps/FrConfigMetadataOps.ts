import { frodo } from '@rockcarver/frodo-lib';
import { ConfigEntityExportInterface } from '@rockcarver/frodo-lib/types/ops/IdmConfigOps';

import { printError, printMessage } from '../utils/Console';

const { readConfigEntity, importConfigEntities } = frodo.idm.config;

const METADATA_ID = 'custom-config.metadata';

/**
 * Export metadata configuration in fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportMetadata(): Promise<boolean> {
  try {
    const exportData = await readConfigEntity(METADATA_ID);
    printMessage(JSON.stringify(exportData, null, 2), 'data');
    return true;
  } catch (error) {
    printError(error, `Error exporting config-metadata`);
  }
  return false;
}

/**
 * Import metadata configuration in fr-config-manager format.
 * @param {object} metadata an object containing the metadata to import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportMetadata(
  metadata: object
): Promise<boolean> {
  try {
    const importData: ConfigEntityExportInterface = {
      idm: {
        [METADATA_ID]: {
          _id: METADATA_ID,
          ...metadata,
        },
      },
    };
    await importConfigEntities(importData);
    return true;
  } catch (error) {
    printError(error, 'Error importing config-metadata.');
  }
  return false;
}
