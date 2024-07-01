import { frodo, FrodoError, state } from '@rockcarver/frodo-lib';
import {
  FullExportInterface,
  FullExportOptions,
  FullImportOptions,
} from '@rockcarver/frodo-lib/types/ops/ConfigOps';
import { SyncSkeleton } from '@rockcarver/frodo-lib/types/ops/MappingOps';
import { ScriptExportInterface } from '@rockcarver/frodo-lib/types/ops/ScriptOps';
import fs from 'fs';

import {
  getFullExportConfig,
  getFullExportConfigFromDirectory,
} from '../utils/Config';
import { cleanupProgressIndicators, printError } from '../utils/Console';
import { writeSyncJsonToDirectory } from './MappingOps';
import { extractScriptToFile } from './ScriptOps';

const { getTypedFilename, saveJsonToFile, getFilePath, getWorkingDirectory } =
  frodo.utils;
const { exportFullConfiguration, importFullConfiguration } = frodo.config;

/**
 * Export everything to separate files
 * @param {String} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {FullExportOptions} options export options
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportEverythingToFile(
  file: string,
  includeMeta: boolean = true,
  options: FullExportOptions = {
    useStringArrays: true,
    noDecode: false,
    coords: true,
    includeDefault: false,
  }
): Promise<boolean> {
  try {
    const collectErrors: Error[] = [];
    const exportData = await exportFullConfiguration(options, collectErrors);
    let fileName = 'everything.json';
    if (file) {
      fileName = file;
    }
    saveJsonToFile(exportData, getFilePath(fileName, true), includeMeta);
    if (collectErrors.length > 0) {
      throw new FrodoError(`Errors occurred during full export`, collectErrors);
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Export everything to separate files
 * @param {boolean} extract Extracts the scripts from the exports into separate files if true
 * @param {boolean} separateMappings separate sync.json mappings if true, otherwise keep them in a single file
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {FullExportOptions} options export options
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportEverythingToFiles(
  extract: boolean = false,
  separateMappings: boolean = false,
  includeMeta: boolean = true,
  options: FullExportOptions = {
    useStringArrays: true,
    noDecode: false,
    coords: true,
    includeDefault: false,
  }
): Promise<boolean> {
  try {
    const collectErrors: Error[] = [];
    const exportData: FullExportInterface = await exportFullConfiguration(
      options,
      collectErrors
    );
    delete exportData.meta;
    const baseDirectory = getWorkingDirectory(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(exportData.global).forEach(([type, obj]: [string, any]) =>
      exportItem(
        exportData.global,
        type,
        obj,
        baseDirectory + '/global',
        includeMeta,
        extract,
        separateMappings
      )
    );
    Object.entries(exportData.realm).forEach(([realm, data]: [string, any]) =>
      Object.entries(data).forEach(([type, obj]: [string, any]) =>
        exportItem(
          data,
          type,
          obj,
          baseDirectory + '/realm/' + realm,
          includeMeta,
          extract,
          separateMappings
        )
      )
    );
    exportItem(
      exportData,
      'idm',
      exportData.idm,
      baseDirectory,
      includeMeta,
      extract,
      separateMappings
    );
    if (collectErrors.length > 0) {
      throw new FrodoError(`Errors occurred during full export`, collectErrors);
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Import everything from a single file
 * @param {string} file The file path
 * @param {FullImportOptions} options import options
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importEverythingFromFile(
  file: string,
  options: FullImportOptions = {
    reUuidJourneys: false,
    reUuidScripts: false,
    cleanServices: false,
    includeDefault: false,
  }
): Promise<boolean> {
  try {
    const data = await getFullExportConfig(file);
    const collectErrors: Error[] = [];
    await importFullConfiguration(data, options, collectErrors);
    if (collectErrors.length > 0) {
      throw new FrodoError(
        `Errors occurred during full config import`,
        collectErrors
      );
    }
    return true;
  } catch (error) {
    cleanupProgressIndicators();
    printError(error);
  }
  return false;
}

/**
 * Import everything from separate files
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importEverythingFromFiles(
  options: FullImportOptions = {
    reUuidJourneys: false,
    reUuidScripts: false,
    cleanServices: false,
    includeDefault: false,
  }
): Promise<boolean> {
  try {
    const data = await getFullExportConfigFromDirectory(state.getDirectory());
    const collectErrors: Error[] = [];
    await importFullConfiguration(data, options, collectErrors);
    if (collectErrors.length > 0) {
      throw new FrodoError(
        `Errors occurred during full config import`,
        collectErrors
      );
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Export item
 * @param {FullExportInterface} exportData the export data
 * @param {string} type the type of export data
 * @param {any} obj the export data for the given item
 * @param {string} baseDirectory the baseDirectory to export to
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract Extracts the scripts from the exports into separate files if true
 * @param {boolean} separateMappings separate sync.json mappings if true, otherwise keep them in a single file
 */
function exportItem(
  exportData,
  type,
  obj,
  baseDirectory,
  includeMeta,
  extract,
  separateMappings
) {
  if (!obj || !Object.keys(obj).length) {
    return;
  }
  if (type == 'other') {
    Object.entries(obj).forEach(([type2, obj2]: [string, any]) =>
      exportItem(
        obj,
        type2,
        obj2,
        baseDirectory + '/other',
        includeMeta,
        extract,
        separateMappings
      )
    );
    return;
  }
  if (!fs.existsSync(`${baseDirectory}/${type}`)) {
    fs.mkdirSync(`${baseDirectory}/${type}`, {
      recursive: true,
    });
  }
  if (type == 'saml') {
    const samlData = {
      saml: {
        cot: {},
        hosted: {},
        metadata: {},
        remote: {},
      },
    };
    if (obj.cot && Object.keys(obj.cot).length) {
      if (!fs.existsSync(`${baseDirectory}/cot`)) {
        fs.mkdirSync(`${baseDirectory}/cot`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(obj.cot).forEach(([id, value]: [string, any]) => {
        samlData.saml.cot = {
          [id]: value,
        };
        saveJsonToFile(
          samlData,
          `${baseDirectory}/cot/${getTypedFilename(id, 'cot.saml')}`,
          includeMeta
        );
      });
      samlData.saml.cot = {};
    }
    Object.entries(obj.hosted)
      .concat(Object.entries(obj.remote))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .forEach(([id, value]: [string, any]) => {
        const filename = getTypedFilename(
          value.entityId ? value.entityId : id,
          type
        );
        const samlType = obj.hosted[id] ? 'hosted' : 'remote';
        samlData.saml[samlType][id] = value;
        samlData.saml.metadata = {
          [id]: obj.metadata[id],
        };
        saveJsonToFile(
          samlData,
          `${baseDirectory}/${type}/${filename}`,
          includeMeta
        );
        samlData.saml[samlType] = {};
      });
    if (!fs.readdirSync(`${baseDirectory}/${type}`).length) {
      fs.rmdirSync(`${baseDirectory}/${type}`);
    }
  } else if (type == 'authentication') {
    const fileName = getTypedFilename(
      `${baseDirectory.substring(baseDirectory.lastIndexOf('/') + 1)}`,
      'authentication.settings'
    );
    saveJsonToFile(
      {
        authentication: obj,
      },
      `${baseDirectory}/${type}/${fileName}`,
      includeMeta
    );
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(obj).forEach(([id, value]: [string, any]) => {
      if (type == 'idm') {
        if (value != null) {
          if (separateMappings && id === 'sync') {
            writeSyncJsonToDirectory(value as SyncSkeleton, `${type}/sync`);
          } else {
            const filename = `${id}.json`;
            if (filename.includes('/')) {
              fs.mkdirSync(
                `${baseDirectory}/${type}/${filename.slice(
                  0,
                  filename.lastIndexOf('/')
                )}`,
                {
                  recursive: true,
                }
              );
            }
            saveJsonToFile(
              value,
              `${baseDirectory}/${type}/${filename}`,
              false
            );
          }
        }
      } else if (type == 'server') {
        if (value != null) {
          const properties = value.properties;
          delete value.properties;
          //Save server export data
          const fileName = getTypedFilename(id, type);
          saveJsonToFile(
            {
              [type]: {
                [id]: value,
              },
            },
            `${baseDirectory}/${type}/${fileName}`,
            includeMeta
          );
          //Save server properties separately in their own directories
          if (!fs.existsSync(`${baseDirectory}/${type}/${id}`)) {
            fs.mkdirSync(`${baseDirectory}/${type}/${id}`);
          }
          Object.entries(properties).forEach(([name, value]: [string, any]) => {
            saveJsonToFile(
              value,
              `${baseDirectory}/${type}/${id}/${name}.json`,
              false
            );
          });
        }
      } else {
        let name =
          value && value.name && type !== 'emailTemplate'
            ? value.name
            : undefined;
        if (type === 'realm') {
          if (!name || name === '/') {
            name = 'root';
          } else {
            name = (value.parentPath.substring(1) + name).replaceAll('/', '-');
          }
        }
        const filename = getTypedFilename(name ? name : id, type);
        if (extract && type == 'script') {
          extractScriptToFile(
            exportData as ScriptExportInterface,
            id,
            baseDirectory.substring(getWorkingDirectory(false).length + 1) +
              '/' +
              type
          );
        }
        saveJsonToFile(
          {
            [type]: {
              [id]: value,
            },
          },
          `${baseDirectory}/${type}/${filename}`,
          includeMeta
        );
      }
    });
  }
}
