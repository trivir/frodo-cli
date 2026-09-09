import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError, printMessage } from '../utils/Console';

const { readConfigEntity, importConfigEntities } = frodo.idm.config;


/**
 * Export metadata configuration in fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportMetadata(): Promise<boolean> {
  try {
    const exportData = await readConfigEntity('custom-config.metadata');
    printMessage(exportData, 'data');
    return true;
  } catch (error) {
    printError(error, `Error exporting config-metadata`);
  }
  return false;
}

/**
 * Import metadata configuration in fr-config-manager format.
 * @param {string} metadata a JSON string containing the metadata object to import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportMetadata(
  metadata: string
): Promise<boolean> {
  try {
    const importData = { idm: { 'custom-config.metadata': JSON.parse(metadata) } };
    await importConfigEntities(importData);
    return true;
  } catch (error) {
    printError(error, 'Error importing config-metadata.');
  }
  return false;
}
