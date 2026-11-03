import fs from 'fs';
import { frodo } from '@rockcarver/frodo-lib';
import { printError, printMessage } from '../utils/Console';

const { readConfigEntitiesByType, importConfigEntities, deleteConfigEntity } =
  frodo.idm.config;
const { saveJsonToFile, getFilePath } = frodo.utils;

/**
 * Export IDM locales configuration object in the fr-config-manager format.
 * @param {string} localeName optional name of the locale to export
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportLocales(
  localeName?: string
): Promise<boolean> {
  try {
    const exportData = await readConfigEntitiesByType('uilocale');
    processLocales(exportData, 'locales', localeName);
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity locales`);
  }
  return false;
}

function processLocales(locales, fileDir, name?) {
  try {
    locales.forEach((locale) => {
      const localeName = locale._id.split('/')[1];
      if (name && name !== localeName) {
        return;
      }
      const localeFilename = `${fileDir}/${localeName}.json`;

      saveJsonToFile(locale, getFilePath(localeFilename, true), false, true);
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

/**
 * Delete IDM locales using fr-config-manager selection rules.
 * @param {string} localeName Optional exact locale name. If omitted, targets all locales.
 * @param {boolean} dryRun Show matching locales without deleting them.
 * @returns {Promise<boolean>} False if reading or deletion fails or a named locale is not found; otherwise true.
 */
export async function configManagerDeleteLocales(
  localeName?: string,
  dryRun: boolean = false
): Promise<boolean> {
  try {
    const locales = await readConfigEntitiesByType('uilocale');
    const selectedLocales = localeName
      ? locales.filter((locale) => locale._id === `uilocale/${localeName}`)
      : locales;
    if (selectedLocales.length === 0) {
      if (localeName) {
        printMessage(`Warning: locale '${localeName}' not found.`);
        return false;
      }
      printMessage('No locales found to delete.');
      return true;
    }
    let success = true;
    for (const locale of selectedLocales) {
      const name = locale._id.slice('uilocale/'.length);
      if (dryRun) {
        printMessage(`Dry run: Deleting uilocale: ${name}`);
        continue;
      }
      try {
        await deleteConfigEntity(locale._id);
        printMessage(`Deleting uilocale: ${name}`);
      } catch (error) {
        printError(error, `Error deleting uilocale ${name}`);
        success = false;
      }
    }
    return success;
  } catch (error) {
    printError(error, 'Error deleting config entity locales');
    return false;
  }
}
