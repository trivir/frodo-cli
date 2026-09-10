import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import { ConfigEntityExportInterface } from '@rockcarver/frodo-lib/types/ops/IdmConfigOps';

import { printError, printMessage } from '../utils/Console';

const { readConfigEntity, importConfigEntities } = frodo.idm.config;

/**
 * Export metadata configuration in fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportMetadata(): Promise<boolean> {
  try {
    const exportData = await readConfigEntity('custom-config.metadata');
    printMessage(JSON.stringify(exportData, null, 2), 'data');
    return true;
  } catch (error) {
    printError(error, `Error exporting config-metadata`);
  }
  return false;
}

/**
 * Import metadata configuration in fr-config-manager format.
 * @param {IdObjectSkeletonInterface} metadata a JSON string containing the metadata object to import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportMetadata(
  metadata: IdObjectSkeletonInterface
): Promise<boolean> {
  try {
    const importData: ConfigEntityExportInterface = {
      idm: { 'custom-config.metadata': metadata },
    };
    await importConfigEntities(importData);
    return true;
  } catch (error) {
    printError(error, 'Error importing config-metadata.');
  }
  return false;
}
