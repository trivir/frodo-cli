import { frodo } from '@rockcarver/frodo-lib';

import { getIdmImportExportOptions } from '../ops/IdmOps';
import { printError } from '../utils/Console';

const { exportConfigEntity } = frodo.idm.config;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportAudit(
  envFile?: string
): Promise<boolean> {
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
    const exportData = (
      await exportConfigEntity('audit', {
        envReplaceParams: options.envReplaceParams,
        entitiesToExport: undefined,
      })
    ).idm['audit'];

<<<<<<< HEAD
    saveJsonToFile(exportData, getFilePath('audit/audit.json', true), false);
=======
    saveJsonToFile(
      exportData, 
      getFilePath('audit/audit.json', true), 
      false
    );
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity audit`);
  }
  return false;
}
