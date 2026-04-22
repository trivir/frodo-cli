import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { readConfigEntitiesByType, importConfigEntities } = frodo.idm.config;
const { saveJsonToFile, getFilePath } = frodo.utils;

/**
 * Export IDM locales configuration object in the fr-config-manager format.
 * @param {string} localeName optional name of the locale to export
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportLocales(
  localeName?: string
): Promise<boolean> {
  let indicatorId: string | undefined;
  try {
    const exportData = await readConfigEntitiesByType('uilocale');
    const localesToExport = exportData.filter((locale) => {
      const name = locale._id.split('/')[1];
      return !localeName || localeName === name;
    });
    indicatorId = createProgressIndicator(
      'determinate',
      localesToExport.length,
      'Exporting locales'
    );
    processLocales(localesToExport, 'locales', indicatorId);
    stopProgressIndicator(
      indicatorId,
      `${localesToExport.length} locales exported.`
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(indicatorId, 'Error exporting locales', 'fail');
    }
    printError(error, `Error exporting config entity locales`);
  }
  return false;
}

function processLocales(locales, fileDir, indicatorId?: string) {
  try {
    locales.forEach((locale) => {
      const localeName = locale._id.split('/')[1];
      const localeFilename = `${fileDir}/${localeName}.json`;

      saveJsonToFile(locale, getFilePath(localeFilename, true), false, true);
      if (indicatorId) {
        updateProgressIndicator(indicatorId, `Exporting locale ${localeName}`);
      }
    });
  } catch (err) {
    printError(err);
  }
}

/**
 * Import IDM locales configuration object in the fr-config-manager format.
 * @param {string} localeName optional name of the locale to import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportLocales(
  localeName?: string
): Promise<boolean> {
  try {
    const localeDir = getFilePath('locales');
    const localeFiles = fs.readdirSync(localeDir, 'utf8');
    const importLocaleData = { idm: {} };
    for (const localeFile of localeFiles) {
      const filePath = getFilePath(`locales/${localeFile}`);
      const readLocale = fs.readFileSync(filePath, 'utf8') as any;
      const importData = JSON.parse(readLocale) as any;
      const id = importData._id;
      if (localeName && id !== `uilocale/${localeName}`) {
        continue;
      }
      importLocaleData.idm[id] = importData;
    }
    await importConfigEntities(importLocaleData);
    return true;
  } catch (error) {
    printError(error, `Error importing config entity locales`);
    return false;
  }
}
