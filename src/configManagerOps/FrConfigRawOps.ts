import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import { readFile } from 'fs/promises';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
  verboseMessage,
} from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { exportRawConfig } = frodo.rawConfig;

/**
 * Export every item from the list in the provided json file
 * @returns True if each file was successfully exported
 */
export async function configManagerExportRaw(file: string): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Exporting raw config'
    );
    const jsonData = JSON.parse(await readFile(file, { encoding: 'utf8' }));

    // Create export json file for every item in the provided json file
    for (const config of jsonData) {
      updateProgressIndicator(
        indicatorId,
        `Exporting raw config ${config.path ?? ''}`.trim()
      );
      const response: IdObjectSkeletonInterface = await exportRawConfig(config);
      verboseMessage(`Saving ${response._id} at ${config.path}.json.`);
      saveJsonToFile(
        response,
        getFilePath(`raw/${config.path}.json`, true),
        false,
        true
      );
    }

    stopProgressIndicator(indicatorId, 'Exported raw config');
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(indicatorId, 'Error exporting raw config', 'fail');
    }
    printError(error);
    return false;
  }
}
