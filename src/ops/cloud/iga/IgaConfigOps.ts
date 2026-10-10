import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { CommonsConfig } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaConfigApi';
import { ConfigExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaConfigOps';
import fs from 'fs';

import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../../../utils/Console';

const { getTypedFilename, saveJsonToFile, getFilePath, getWorkingDirectory } =
  frodo.utils;
const {
  readConfig,
  readConfigByKey,
  exportConfig,
  exportConfigByKey,
  importConfig,
  importConfigByKey,
} = frodo.cloud.iga.config;
/**
 * List all the iga config
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listConfig(): Promise<boolean> {
  try {
    const configurations = await readConfig();
    const table = createTable(['Key', 'Settings']);
    for (const [key, value] of Object.entries(configurations)) {
      table.push([key, JSON.stringify(value, null, 2)]);
    }
    printMessage(table.toString(), 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Describe a config key
 * @param {string} key config key. If not specified, the first available key will be used.
 * @param {string} file optional config export file to read from instead of the API
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeConfigByKey(
  key?: string,
  file?: string
): Promise<boolean> {
  try {
    let configData;

    if (file) {
      const data = fs.readFileSync(file, 'utf8');
      const configExport: ConfigExportInterface = JSON.parse(data);

      if (!key) {
        const keys = Object.keys(configExport.config);
        if (keys.length === 0) {
          throw new FrodoError(`No config keys found in export file ${file}`);
        }
        key = keys[0];
      }

      if (!configExport.config[key as keyof CommonsConfig]) {
        throw new FrodoError(`Key '${key}' not found in export file ${file}`);
      }

      configData = configExport.config[key as keyof CommonsConfig];

      if (Object.keys(configData).length === 0) {
        printMessage(`\n${key}`, 'data');
        printMessage('', 'data');
        return true;
      }
    } else {
      if (!key) {
        const allConfig = await readConfig();
        const keys = Object.keys(allConfig);
        if (keys.length === 0) {
          throw new FrodoError(`No config keys found`);
        }
        key = keys[0];
      }
      configData = await readConfigByKey(key);
    }

    // Print key header
    printMessage(`\n${key}`, 'data');

    // Print settings as key value table
    const table = createKeyValueTable();
    for (const [setting, value] of Object.entries(configData)) {
      if (Array.isArray(value)) {
        table.push([setting['brightCyan'], `[${value.join(', ')}]`]);
      } else if (typeof value === 'object' && value !== null) {
        table.push([setting['brightCyan'], JSON.stringify(value, null, 2)]);
      } else if (typeof value === 'boolean') {
        table.push([
          setting['brightCyan'],
          value ? 'true'['brightGreen'] : 'false'['brightRed'],
        ]);
      } else {
        table.push([setting['brightCyan'], `${value}`]);
      }
    }
    printMessage(table.toString() + '\n', 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
/**
 * Export configuration to file
 * @param {string} key config key
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportConfigByKeyToFile(
  key: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting configuration:${key}...`
  );
  try {
    const exportData = await exportConfigByKey(key);
    if (!file) {
      file = getTypedFilename(key, 'config');
    }
    const filePath = getFilePath(file, true);
    saveJsonToFile(
      exportData,
      filePath,
      includeMeta,
      false,
      keepModifiedProperties
    );
    stopProgressIndicator(
      indicatorId,
      `Exported config ${key} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting config ${key} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}

export async function exportConfigurationsToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportConfig();
    if (!file) {
      file = getTypedFilename(`allConfig`, 'config');
    }
    saveJsonToFile(
      exportData,
      getFilePath(file, true),
      includeMeta,
      false,
      keepModifiedProperties
    );
    return true;
  } catch (error) {
    printError(error, `Error exporting iga config to file`);
  }
  return false;
}
/**
 * Export all iga configurations to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportConfigurationsToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportConfig();
    for (const [key] of Object.entries(exportData.config)) {
      const keyExport = await exportConfigByKey(key);
      saveJsonToFile(
        keyExport,
        getFilePath(getTypedFilename(key, 'config'), true),
        includeMeta,
        false,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting iga config to files`);
  }
  return false;
} /**
 * Import a config from file
 * @param {string} key config key
 * @param {string} file import file name

 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importConfigFromFile(
  key: string,
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing iga config...'
    );
    const filepath = getFilePath(file);
    const readFile = fs.readFileSync(filepath, 'utf8');
    const importData = JSON.parse(readFile);
    updateProgressIndicator(indicatorId, 'Importing iga config...');
    await importConfigByKey(key, importData);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported ${key}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing  ${key}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Import iga config from file
 * @param {String} file file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importConfigurationsFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing iga config...'
    );
    const filePath = getFilePath(file);
    const readFile = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(readFile);
    updateProgressIndicator(indicatorId, 'Importing iga config...');
    await importConfig(importData);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported iga config.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing iga config.`, 'fail');
    printError(error, `Error importing iga config from file`);
  }
  return false;
}

/**
 * Import all iga config from separate files
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importConfigurationsFromFiles(): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const configFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.config.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      configFiles.length,
      'Importing iga config...'
    );
    for (const file of configFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing iga config from file ${file}...`
        );
        await importConfigurationsFromFile(file);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing iga config from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`One or more errors importing iga config`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported iga config.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error(s) importing iga config.`,
      'fail'
    );
    printError(error, `Error importing iga config from files`);
  }
  return false;
}

/**
 * Import first iga config from file
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstConfigFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing iga config...'
    );
    const filePath = getFilePath(file);
    const readFile = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(readFile);
    const keys = Object.keys(importData.config);

    if (keys.length === 0)
      throw new FrodoError(`No iga config found in import data`);
    await importConfigByKey(keys[0], importData);
    stopProgressIndicator(
      indicatorId,
      `Imported iga config from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing iga config from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}
