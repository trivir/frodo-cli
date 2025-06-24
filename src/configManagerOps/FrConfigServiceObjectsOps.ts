import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printError } from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { getServiceObject } = frodo.serviceObject;
/**
 * Export an IDM configuration object in the fr-config-manager format.
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportServiceObjectsFromFile(
  file
): Promise<boolean> {
  try {
    const objects = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const objectType of Object.keys(objects)) {
      for (const object of objects[objectType]) {
        const result = await getServiceObject(objectType, object);
        // to make sure if the overrides has (an) object(s)
        if (
          object.overrides &&
          typeof object.overrides === 'object' &&
          !Array.isArray(object.overrides) &&
          object.overrides !== null &&
          Object.keys(object.overrides).length !== 0
        ) {
          for (const [key, value] of Object.entries(object.overrides) as [
            string,
            any,
          ]) {
            result[key] = value;
          }
        }
        saveJsonToFile(
          result,
          getFilePath(
            `service-objects/${objectType}/${object.searchValue}.json`,
            true
          ),
          false,
          true
        );
      }
    }
    return true;
  } catch (err) {
    printError(err, `Error exporting service-objects`);
  }
  return false;
}

export async function configManagerExportServiceObject(
  type,
  searchField,
  searchValue,
  fields,
  overrideField?,
  overrideValue?
): Promise<boolean> {
  try {
    const object = {
      [type]: {
        searchField: searchField,
        searchValue: searchValue,
        fields: fields,
        overrides:
          overrideField && overrideValue
            ? { [overrideField]: overrideValue }
            : {},
      },
    };
    const result = getServiceObject(type, object);
    if (Object.keys(object[type].overrides).length !== 0) {
      for (const [key, value] of Object.entries(object[type].overrides)) {
        result[key] = value;
      }
    }
    saveJsonToFile(
      result,
      getFilePath(`service-objects/${type}/${searchValue}.json`, true),
      false,
      true
    );
    return true;
  } catch (err) {
    printError(err, `Error exporting object`);
  }
}
