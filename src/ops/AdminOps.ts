import { frodo, state } from '@rockcarver/frodo-lib';
import {
  FullExportInterface,
  FullExportOptions,
} from '@rockcarver/frodo-lib/types/ops/AdminOps';
import fs from 'fs';

const {
  getRealmName,
  getTypedFilename,
  titleCase,
  saveJsonToFile,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const { exportFullConfiguration } = frodo.admin;

/**
 * Export everything to separate files
 * @param file file name
 * @param {FullExportOptions} options export options
 */
export async function exportEverythingToFile(
  file,
  options: FullExportOptions = {
    useStringArrays: true,
    noDecode: false,
  }
): Promise<void> {
  const exportData = await exportFullConfiguration(options);
  let fileName = getTypedFilename(
    `${titleCase(getRealmName(state.getRealm()))}`,
    `everything`
  );
  if (file) {
    fileName = file;
  }
  saveJsonToFile(exportData, getFilePath(fileName, true));
}

/**
 * Export everything to separate files
 * @param {FullExportOptions} options export options
 */
export async function exportEverythingToFiles(
  options: FullExportOptions = {
    useStringArrays: true,
    noDecode: false,
  }
): Promise<void> {
  const exportData: FullExportInterface =
    await exportFullConfiguration(options);
  delete exportData.meta;
  const baseDirectory = getWorkingDirectory(true);
  Object.entries(exportData).forEach(([type, obj]) => {
    if (!fs.existsSync(`${baseDirectory}/${type}`)) {
      fs.mkdirSync(`${baseDirectory}/${type}`);
    }
    Object.entries(obj).forEach(([id, value]: [string, any]) => {
      if (type === 'saml') {
        if (!fs.existsSync(`${baseDirectory}/${type}/${id}`)) {
          fs.mkdirSync(`${baseDirectory}/${type}/${id}`);
        }
        Object.entries(value as object).forEach(
          ([subId, subValue]: [string, any]) => {
            const filename = getTypedFilename(
              subValue.name ? subValue.name : subId,
              `${id}.${type}`
            );
            const fileData = {};
            fileData[type] = {};
            fileData[type][id] = {};
            fileData[type][id][subId] = subValue;
            saveJsonToFile(
              subValue,
              `${baseDirectory}/${type}/${id}/${filename}`
            );
          }
        );
      }
      const filename = getTypedFilename(value.name ? value.name : id, type);
      const fileData = {};
      fileData[type] = {};
      fileData[type][id] = value;
      saveJsonToFile(fileData, `${baseDirectory}/${type}/${filename}`);
    });
  });
}
