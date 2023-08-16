import { frodo, state } from '@rockcarver/frodo-lib';

const { getRealmName } = frodo.helper.utils;
const { getTypedFilename, titleCase, saveJsonToFile } = frodo.utils.impex;
const { exportFullConfiguration } = frodo.admin;

/**
 * Export everything to separate files
 * @param file file name
 */
export async function exportEverythingToFile(file, globalConfig = false, useStringArrays = false): Promise<void> {
  const exportData = await exportFullConfiguration(globalConfig, useStringArrays);
  let fileName = getTypedFilename(
    `${titleCase(getRealmName(state.getRealm()))}`,
    `everything`
  );
  if (file) {
    fileName = file;
  }
  saveJsonToFile(exportData, fileName);
}

/**
 * Export everything to separate files
 * @param file file name
 */
export async function exportEverythingToFiles(globalConfig = false, useStringArrays = false): Promise<void> {
  const exportData = await exportFullConfiguration(globalConfig, useStringArrays);
  //TODO
}
