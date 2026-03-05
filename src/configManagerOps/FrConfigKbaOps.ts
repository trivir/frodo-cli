import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';
import path from 'path';

import { getIdmImportExportOptions } from '../ops/IdmOps';
import { errorHandler } from '../ops/utils/OpsUtils';
import { printError } from '../utils/Console';

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
  try {
    const options = getIdmImportExportOptions(undefined, envFile);
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
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity selfservice.kba`);
  }
  return false;
}

export async function configManagerImportKbaConfig(
  file?: string,
  envFile?: string,
  validate: boolean = false
): Promise<boolean> {
  try {
    const fileData = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    let importData = JSON.parse(fileData);
    importData = { idm: { [importData._id]: importData } };
    const options = getIdmImportExportOptions(undefined, envFile);
    await importConfigEntities(
      importData,
      'selfservice.kba',
      {
        envReplaceParams: options.envReplaceParams,
        entitiesToImport: undefined,
        validate,
      },
      errorHandler
    );
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
