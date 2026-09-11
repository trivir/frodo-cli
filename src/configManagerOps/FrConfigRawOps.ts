import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import fs from 'fs';
import { readFile } from 'fs/promises';

import {
  createProgressIndicator,
  printError,
  printMessage,
  stopProgressIndicator,
  verboseMessage,
} from '../utils/Console';
import { clearOperationalAttributes } from '../utils/FrConfig';
import { Protocol } from '@modelcontextprotocol/server';

const { getFilePath, saveJsonToFile, readJsonFile, getWorkingDirectory } =
  frodo.utils;
const { exportRawConfig, importRawConfig } = frodo.rawConfig;

/**
 * Export every item from the list in the provided json file
 * @param {string} file the config file to pull from
 * @param {boolean} stdout if true will display stdout in cli
 * @param {string} apiVersion  will pull config including the api version
 * @param {string} path the api path to pull config
 * @returns True if each file was successfully exported
 */
export async function configManagerExportRaw(
  file: string,
  stdout = false,
  apiVersion?: { protocol?: string; resouce?: string },
  path?: string
): Promise<boolean> {
  try {
    let rawConfig;

    if (path) {
      rawConfig = [
        { path, 
          ...(apiVersion ? { pushApiVersion: apiVersion} : {})
        },
      ];
    } else if (file) {
      rawConfig = JSON.parse(await readFile(file, { encoding: 'utf8' }));
    } else {
      printMessage(
        'Specify --path or --config-file to export raw configuration.',
        'error'
      );
      return false;
    }

    // Create export json file for every item in the provided json file
    for (const config of rawConfig) {
      config.path = config.path.startsWith('/')
        ? config.path
        : `/${config.path}`;

      const response: IdObjectSkeletonInterface = await exportRawConfig(config);

      if (config.pushApiVersion) {
        response._pushApiVersion = config.pushApiVersion;
      }
      if (stdout) {
        printMessage(response, 'data');
      } else {
        verboseMessage(`Saving ${response._id} at ${config.path}.json.`);
        saveJsonToFile(
          response,
          getFilePath(`raw/${config.path}.json`, true),
          false,
          true
        );
      }
    }

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Import all raw configuration exported in fr-config-manager format
 * @param {string} path optional flag to import only the specific configuration
 * @param {boolean} stdin True to read config from stdin
 * @returns {Promise<boolean>} true if each file was successfully imported
 */
export async function configManagerImportRaw(
  path?: string,
  stdin = false
): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'indeterminate',
    0,
    'Importing raw config...'
  );
  try {
    if (stdin) {
      const data = readJsonFile(process.stdin.fd) as IdObjectSkeletonInterface;
      const apiVersion = data._pushApiVersion 
      clearOperationalAttributes(data);
      data._pushApiVersion = apiVersion
      await importRawConfig({ path }, data);
      stopProgressIndicator(
        indicatorId,
        'Raw config import completed.',
        'success'
      );
      return true;
    }

    const rawDir = `${getWorkingDirectory()}/raw`;
    const files = getJsonFiles(rawDir);
    for (const filePath of files) {
      const rawPath = filePath
        .slice(rawDir.length)
        .replace(/\.json$/, '')
        .replace(/\\/g, '/');
      if (path && !rawPath.startsWith(path)) {
        continue;
      }

      const data = readJsonFile(filePath) as IdObjectSkeletonInterface;
      const apiVersion = data._pushApiVersion 
      clearOperationalAttributes(data);
      data._pushApiVersion  = apiVersion
      await importRawConfig({ path: rawPath }, data);
    }
    stopProgressIndicator(
      indicatorId,
      'Raw config import completed.',
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, 'Raw config import failes.', 'fail');
    printError(error, 'Raw import failed');
    return false;
  }
}

/**
 * Recursively walks a directory tree and returns the full paths of all .json files found.
 * @param {string} dir root directory to search
 * @returns {string[]} full paths of all .json files found
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
