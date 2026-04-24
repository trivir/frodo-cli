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
export async function configManagerExportAccessConfig(
  envFile?: string
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting access config'
    );
    const exportData = (
      await exportConfigEntity('access', {
        envReplaceParams: options.envReplaceParams,
        entitiesToExport: undefined,
      })
    ).idm['access'];

    saveJsonToFile(
      exportData,
      getFilePath('access-config/access.json', true),
      false
    );
    stopProgressIndicator(indicatorId, 'Exported access config');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting access config',
        'fail'
      );
    }
    printError(error, `Error exporting access configuration`);
  }
  return false;
}

/**
 * Import access configuration from fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportAccessConfig(): Promise<boolean> {
  try {
    const accessConfigFile = getFilePath('access-config/access.json');
    const readAccessConfig = fs.readFileSync(accessConfigFile, 'utf-8');
    let accessConfigImportData = JSON.parse(readAccessConfig);
    const id = accessConfigImportData._id;
    accessConfigImportData = { idm: { [id]: accessConfigImportData } };
    await importConfigEntities(accessConfigImportData);
    return true;
  } catch (error) {
    printError(error, `Error importing access configuration`);
  }
  return false;
}
