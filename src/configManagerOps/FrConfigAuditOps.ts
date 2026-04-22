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
export async function configManagerExportAudit(
  envFile?: string
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
    indicatorId = createProgressIndicator(
      'indeterminate',
      undefined,
      'Exporting audit'
    );
    const exportData = (
      await exportConfigEntity('audit', {
        envReplaceParams: options.envReplaceParams,
        entitiesToExport: undefined,
      })
    ).idm['audit'];

    saveJsonToFile(exportData, getFilePath('audit/audit.json', true), false);

    stopProgressIndicator(indicatorId, 'Exported audit');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(indicatorId, 'Error exporting audit', 'fail');
    }
    printError(error, `Error exporting config entity audit`);
  }
  return false;
}

/**
 * Import audit configuration from fr-config-manager format.
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportAudit(): Promise<boolean> {
  try {
    const auditPath = getFilePath('audit/');
    const auditData = fs.readFileSync(`${auditPath}/audit.json`, 'utf-8');
    let importData = JSON.parse(auditData);
    importData = { idm: { [importData._id]: importData } };
    await importConfigEntities(importData);
    return true;
  } catch (error) {
    printError(error, `Error importing audit configuration`);
  }
  return false;
}
