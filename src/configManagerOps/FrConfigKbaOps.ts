import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { getIdmImportExportOptions } from '../ops/IdmOps';
import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
} from '../utils/Console';

const { exportConfigEntity, importConfigEntities } = frodo.idm.config;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportKbaConfig(
  envFile?: string
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
    indicatorId = createProgressIndicator('indeterminate', 0, 'Exporting kba');
    const exportData = (
      await exportConfigEntity('selfservice.kba', {
        envReplaceParams: options.envReplaceParams,
        entitiesToExport: undefined,
      })
    ).idm['selfservice.kba'];

    saveJsonToFile(
      exportData,
      getFilePath('kba/selfservice.kba.json', true),
      false
    );
    stopProgressIndicator(indicatorId, 'Exported kba');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(indicatorId, 'Error exporting kba', 'fail');
    }
    printError(error, `Error exporting config entity selfservice.kba`);
  }
  return false;
}

export async function configManagerImportKbaConfig(): Promise<boolean> {
  try {
    const filePath = getFilePath('kba/');
    const fileData = fs.readFileSync(
      `${filePath}/selfservice.kba.json`,
      'utf-8'
    );
    let importData = JSON.parse(fileData);
    importData = { idm: { [importData._id]: importData } };
    await importConfigEntities(importData);
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
