import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import fs from 'fs';
import { readFile } from 'fs/promises';

import { printError, verboseMessage } from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { exportRawConfig, importRawConfig } = frodo.rawConfig;

/**
 * Export every item from the list in the provided json file
 * @returns True if each file was successfully exported
 */
export async function configManagerExportRaw(file: string): Promise<boolean> {
  try {
    const jsonData = JSON.parse(await readFile(file, { encoding: 'utf8' }));

    // Create export json file for every item in the provided json file
    for (const config of jsonData) {
      const response: IdObjectSkeletonInterface = await exportRawConfig(config);
      verboseMessage(`Saving ${response._id} at ${config.path}.json.`);
      saveJsonToFile(
        response,
        getFilePath(`raw/${config.path}.json`, true),
        false,
        true
      );
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import all raw configuration exported in fr-config-manager format
 * @param path optional flag to provide path to service config file
 * @returns {Promise<boolean>} true if each file was successfully imported
 */
export async function configManagerImportRaw(path?: string): Promise<boolean> {
  try {
    const rawDir = getFilePath('raw/');
    if (path) {
      const filePath = getFilePath(`raw/${path}.json`);
      const rawPath = path;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data.result && Array.isArray(data.result)) {
        for (const item of data.result) {
          const itemPath = `${rawPath}/${item._id}`;
          delete item._rev;
          delete item._type;
          await importRawConfig({ path: itemPath }, item);
        }
      } else {
        delete data._rev;
        delete data._type;
        await importRawConfig({ path: rawPath }, data);
      }
    } else {
      const files = getJsonFiles(rawDir);
      for (const filePath of files) {
        const rawPath = filePath
          .replace(rawDir, '')
          .replace(/^\//, '')
          .replace(/\.json$/, '');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.result && Array.isArray(data.result)) {
          for (const item of data.result) {
            const itemPath = `${rawPath}/${item._id}`;
            delete item._rev;
            delete item._type;
            await importRawConfig({ path: itemPath }, item);
          }
        } else {
          delete data._rev;
          delete data._type;
          await importRawConfig({ path: rawPath }, data);
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Recursively walks a directory tree and returns the full paths of all .json files found.
 * @param dir root directory to search
 * @returns full paths of all .json files found
 */
function getJsonFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      results.push(...getJsonFiles(full));
    } else if (entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}
