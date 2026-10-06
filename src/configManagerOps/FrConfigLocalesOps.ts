import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';

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
 * @param localeName Optional locale name. If omitted, deletes all locales.
 * @param dryRun Log matching locales without deleting them.
 * @returns true if successful, false if reading or deletion fails,
 * or a requested locale is not found.
 */
export async function configManagerDeleteLocales(
  localeName?: string,
  dryRun = false
): Promise<boolean> {
  try {
    const locales = (await readConfigEntitiesByType('uilocale')).filter(
      (locale) =>
        typeof locale._id === 'string' && locale._id.startsWith('uilocale/')
    );
    if (locales.length === 0) {
      console.log('No uilocale found to delete.');
      return !localeName;
    }
    let matchFound = false;
    let success = true;
    for (const locale of locales) {
      const name = locale._id.split('/')[1];
      if (localeName && localeName !== name) {
        continue;
      }
      matchFound = true;
      if (dryRun) {
        console.log(`Dry run: Deleting uilocale: ${name}`);
        continue;
      }
      try {
        await deleteConfigEntity(locale._id);
        console.log(`Deleting uilocale: ${name}`);
      } catch (error) {
        printError(error, `Error deleting uilocale ${name}`);
        success = false;
      }
    }
    if (localeName && !matchFound) {
      console.log(`Warning: service '${localeName}' not found.`);
      return false;
    }
    return success;
  } catch (error) {
    printError(error, 'Error deleting config entity locales');
    return false;
  }
}
