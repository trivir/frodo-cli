import { frodo } from '@rockcarver/frodo-lib';
import { IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import { ApiVersion } from '@rockcarver/frodo-lib/types/api/RawConfigApi';
import { RawExportOptions } from '@rockcarver/frodo-lib/types/ops/RawConfigOps';
import fs from 'fs';

import {
  createProgressIndicator,
  printError,
  printMessage,
  stopProgressIndicator,
} from '../utils/Console';
import { clearOperationalAttributes } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile, readJsonFile, getWorkingDirectory } =
  frodo.utils;
const { exportRawConfig, importRawConfig } = frodo.rawConfig;

/**
 * Export raw configuration
 * @param {string} apiVersion will pull config including the API version
 * @param {string} path the optional API path to pull config
 * @param {string} file the optional config file to pull from
 * @param {boolean} stdout if true will display stdout in cli
 * @returns {boolean} True if each file was successfully exported, false otherwise
 */
export async function configManagerExportRaw(
  apiVersion: ApiVersion,
  path?: string,
  file?: string,
  stdout = false
): Promise<boolean> {
  try {
    const rawConfig = path
      ? [{ path, pushApiVersion: apiVersion }]
      : (readJsonFile(file, false) as RawExportOptions[]);
    for (const config of rawConfig) {
      config.path = config.path.startsWith('/')
        ? config.path.substring(1)
        : config.path;

      const response: IdObjectSkeletonInterface = await exportRawConfig(config);

      if (stdout) {
        printMessage(response, 'data');
      } else {
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
      const apiVersion = data._pushApiVersion;
      clearOperationalAttributes(data);
      data._pushApiVersion = apiVersion;
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
      const apiVersion = data._pushApiVersion;
      clearOperationalAttributes(data);
      data._pushApiVersion = apiVersion;
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
