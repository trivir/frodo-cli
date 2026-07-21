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
 * Export an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportRemoteServers(
  envFile?: string
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting remote servers'
    );
    const exportData = (
      await exportConfigEntity('provisioner.openicf.connectorinfoprovider', {
        envReplaceParams: options.envReplaceParams,
        entitiesToExport: undefined,
      })
    ).idm['provisioner.openicf.connectorinfoprovider'];

    saveJsonToFile(
      exportData,
      getFilePath(
        'sync/rcs/provisioner.openicf.connectorinfoprovider.json',
        true
      ),
      false
    );
    stopProgressIndicator(indicatorId, 'Exported remote servers');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting remote servers',
        'fail'
      );
    }
    printError(
      error,
      `Error exporting config entity RCS: provisioner.openicf.connectorinfoprovider`
    );
  }
  return false;
}
