import { frodo, state } from '@rockcarver/frodo-lib';
import fs from "fs";
import {FullExportInterface} from "../../../frodo-lib/types/api/AdminApi";
import {getFileInfo} from "prettier";

const { getRealmName, getTypedFilename, titleCase, saveJsonToFile } = frodo.utils;
const { exportFullConfiguration } = frodo.admin;

/**
 * Export everything to separate files
 * @param file file name
 * @param globalConfig true if the global service is the target of the operation, false otherwise. Default: false.
 * @param useStringArrays Where applicable, use string arrays to store multi-line text (e.g. scripts).
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
 * @param directory export directory
 * @param globalConfig true if the global service is the target of the operation, false otherwise. Default: false.
 * @param useStringArrays Where applicable, use string arrays to store multi-line text (e.g. scripts).
 */
export async function exportEverythingToFiles(directory, globalConfig = false, useStringArrays = false): Promise<void> {
  const exportData: FullExportInterface = await exportFullConfiguration(globalConfig, useStringArrays);
  delete exportData.meta;
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  Object.entries(exportData).forEach(([type, obj]) => {
    if (!fs.existsSync(`${directory}/${type}`)) {
      fs.mkdirSync(`${directory}/${type}`);
    }
    Object.entries(obj).forEach(([id, value]: [string, any]) => {
      if (type === 'saml') {
        if (!fs.existsSync(`${directory}/${type}/${id}`)) {
          fs.mkdirSync(`${directory}/${type}/${id}`);
        }
        Object.entries(value).forEach(([subId, subValue]: [string, any]) => {
          const filename = getTypedFilename(subValue.name ? subValue.name : subId, `${id}.${type}`);
          const fileData = {};
          fileData[type] = {};
          fileData[type][id] = {};
          fileData[type][id][subId] = subValue;
          saveJsonToFile(subValue, `${directory}/${type}/${id}/${filename}`);
        });
      }
      const filename = getTypedFilename(value.name ? value.name : id, type);
      const fileData = {};
      fileData[type] = {};
      fileData[type][id] = value;
      saveJsonToFile(fileData, `${directory}/${type}/${filename}`);
    });
  });
}
