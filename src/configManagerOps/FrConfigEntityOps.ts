import { frodo } from '@rockcarver/frodo-lib';

import { getIdmImportExportOptions } from '../ops/IdmOps';
import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
} from '../utils/Console';

const { exportConfigEntity } = frodo.idm.config;
const { getFilePath, saveJsonToFile } = frodo.utils;

/**
 * Export an IDM configuration object.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportConfigEntity(
  envFile?: string
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting config entity'
    );
    const exportData = (
      await exportConfigEntity('ui/configuration', {
        envReplaceParams: options.envReplaceParams,
        entitiesToExport: undefined,
      })
    ).idm['ui/configuration'];

    saveJsonToFile(
      exportData,
      getFilePath('ui-configuration.json', true),
      false
    );
    stopProgressIndicator(indicatorId, 'Exported config entity');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting config entity',
        'fail'
      );
    }
    printError(error, `Error exporting config entity ui-configuration`);
  }
  return false;
}
