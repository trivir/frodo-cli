import { frodo } from '@rockcarver/frodo-lib';

import { extractFrConfigDataToFile } from '../utils/Config';
import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readConfigEntity } = frodo.idm.config;

function processMappings(mapping, targetDir, name) {
  try {
    if (name && name !== mapping.name) {
      return;
    }
    const mappingPath = `${targetDir}`;

    Object.entries(mapping).forEach(([key, value]: [string, any]) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        'source' in value &&
        value.type === 'text/javascript'
      ) {
        const scriptText = Array.isArray(value.source)
          ? value.source.join('\n')
          : value.source;

        const scriptFilename = `${mapping.name}.${key}.js`;
        (value as any).file = scriptFilename; // Replace source code with file reference
        extractFrConfigDataToFile(scriptText, scriptFilename, targetDir);

        delete value.source;
      }
    });

    const fileName = `${mappingPath}/${mapping.name}.json`;
    saveJsonToFile(mapping, getFilePath(fileName, true), false, true);
  } catch (err) {
    printError(err);
  }
}

/**
 * Export all mappings to separate files in fr-config-manager format
 * @param {MappingExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportMappings(): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const exportData = await readConfigEntity('sync');
    const fileDir = `sync/mappings`;
    const mappings = Object.values(exportData.mappings);
    indicatorId = createProgressIndicator(
      'determinate',
      mappings.length,
      'Exporting connector mappings'
    );
    for (const mapping of mappings) {
      updateProgressIndicator(
        indicatorId,
        `Exporting connector mapping ${mapping.name}`
      );
      processMappings(mapping, `${fileDir}/${mapping.name}`, mapping.name);
    }
    stopProgressIndicator(indicatorId, `Exported ${mappings.length} mappings`);
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        'Error exporting connector mappings',
        'fail'
      );
    }
    printError(error, `Error exporting connector mappings`);
  }
  return false;
}
