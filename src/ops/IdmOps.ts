import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { type IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import {
  type ConfigEntityExportInterface,
  type ConfigEntityImportOptions,
} from '@rockcarver/frodo-lib/types/ops/IdmConfigOps';
import { SyncSkeleton } from '@rockcarver/frodo-lib/types/ops/MappingOps';
import fs from 'fs';
import path from 'path';
import propertiesReader from 'properties-reader';

import {
  createProgressIndicator,
  printError,
  printMessage,
  stopProgressIndicator,
} from '../utils/Console';
import {
  getLegacyMappingsFromFiles,
  writeSyncJsonToDirectory,
} from './MappingOps';

const {
  unSubstituteEnvParams,
  areScriptHooksValid,
  getFilePath,
  getTypedFilename,
  readFiles,
  getWorkingDirectory,
  saveJsonToFile,
} = frodo.utils;

const {
  readConfigEntities,
  readConfigEntity,
  exportConfigEntities,
  updateConfigEntity,
  importConfigEntities,
} = frodo.idm.config;
const { queryManagedObjects } = frodo.idm.managed;
const { testConnectorServers } = frodo.idm.system;

/**
 * Warn about and list offline remote connector servers
 * @return {Promise<boolean>} a promise that resolves to true if a warning was printed, false otherwise
 */
export async function warnAboutOfflineConnectorServers(): Promise<boolean> {
  try {
    const all = await testConnectorServers();
    const offline = all
      .filter((status) => !status.ok)
      .map((status) => status.name);
    if (offline.length > 0) {
      printMessage(
        `\nThe following connector server(s) are offline and their connectors and configuration unavailable:\n${offline.join(
          '\n'
        )}`,
        'warn'
      );
      return true;
    }
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * List all IDM configuration objects
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function listAllConfigEntities(): Promise<boolean> {
  try {
    const configurations = await readConfigEntities();
    for (const configEntity of configurations) {
      printMessage(`${configEntity._id}`, 'data');
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Export an IDM configuration object.
 * @param {string} id the desired configuration object
 * @param {string} file optional export file name (or directory name if exporting mappings separately)
 * @param {boolean} separateMappings separate sync.json mappings if true (and id is "sync"), otherwise keep them in a single file
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportConfigEntity(
  id: string,
  file: string,
  separateMappings: boolean = false
): Promise<boolean> {
  try {
    const configEntity = await readConfigEntity(id);
    if (separateMappings && id === 'sync') {
      writeSyncJsonToDirectory(configEntity as SyncSkeleton, file);
      return true;
    }
    let fileName = file;
    if (!fileName) {
      fileName = getTypedFilename(`${id}`, 'idm');
    }
    saveJsonToFile(configEntity, getFilePath(fileName, true), false);
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity ${id}`);
  }
  return false;
}

/**
 * Export all IDM configuration objects
 * @param {string} file file to export to
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportAllConfigEntitiesToFile(
  file?: string,
  entitiesFile?: string,
  envFile?: string,
  includeMeta: boolean = true
): Promise<boolean> {
  try {
    const exportData = await exportIdmConfigEntities(entitiesFile, envFile);
    let fileName = getTypedFilename(`all`, `idm`);
    if (file) {
      fileName = file;
    }
    saveJsonToFile(exportData, getFilePath(fileName, true), includeMeta);
    return true;
  } catch (error) {
    printError(error, `Error exporting idm config to file`);
  }
  return false;
}

/**
 * Export all IDM configuration objects to separate files
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @param {boolean} separateMappings separate sync.json mappings if true, otherwise keep them in a single file
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportAllConfigEntitiesToFiles(
  entitiesFile?: string,
  envFile?: string,
  separateMappings: boolean = false
): Promise<boolean> {
  const errors: Error[] = [];
  try {
    const exportData = await exportIdmConfigEntities(entitiesFile, envFile);
    for (const [id, obj] of Object.entries(exportData.idm)) {
      try {
        if (separateMappings && id === 'sync') {
          writeSyncJsonToDirectory(obj as SyncSkeleton);
          continue;
        }
        saveJsonToFile(obj, getFilePath(`${id}.json`, true), false);
      } catch (error) {
        errors.push(new FrodoError(`Error saving config entity ${id}`, error));
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`Error saving config entities`, errors);
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Import an IDM configuration object by id from file.
 * @param {string} entityId the configuration object to import
 * @param {string} file optional file to import
 * @param {boolean} validate validate script hooks
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importConfigEntityByIdFromFile(
  entityId: string,
  file?: string,
  validate?: boolean
): Promise<boolean> {
  try {
    if (!file) {
      file = getTypedFilename(entityId, 'idm');
    }

    const fileData = fs.readFileSync(
      path.resolve(process.cwd(), getFilePath(file)),
      'utf8'
    );

    let entityData;
    if (entityId === 'sync') {
      entityData = getLegacyMappingsFromFiles([
        { content: fileData, path: '/sync.json' },
      ]);
    } else {
      entityData = JSON.parse(fileData);
    }

    const isValid = areScriptHooksValid(entityData);
    if (validate && !isValid) {
      printMessage('Invalid IDM configuration object', 'error');
      return;
    }

    await updateConfigEntity(entityId, entityData);
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Import IDM configuration object from file.
 * @param {string} file optional file to import
 * @param {boolean} validate validate script hooks
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importConfigEntityFromFile(
  file: string,
  validate?: boolean
): Promise<boolean> {
  const filePath = getFilePath(file);
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing ${filePath}...`
    );
    const fileData = fs.readFileSync(
      path.resolve(process.cwd(), filePath),
      'utf8'
    );
    let entityData = JSON.parse(fileData);
    const entityId = entityData._id;

    if (entityId === 'sync') {
      entityData = getLegacyMappingsFromFiles([
        { content: fileData, path: '/sync.json' },
      ]);
    }

    const isValid = areScriptHooksValid(entityData);
    if (validate && !isValid) {
      printMessage('Invalid IDM configuration object', 'error');
      return;
    }

    await updateConfigEntity(entityId, entityData);
    stopProgressIndicator(
      indicatorId,
      `Imported ${entityId} from ${filePath}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing ${filePath}.`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Import all IDM configuration objects from a single file
 * @param {string} file the file with the configuration objects
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @param {ConfigEntityImportOptions} options import options
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importAllConfigEntitiesFromFile(
  file: string,
  entitiesFile?: string,
  envFile?: string,
  options: ConfigEntityImportOptions = {
    validate: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  let filePath;
  try {
    filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Process import data
    const envReader = envFile ? propertiesReader(envFile) : undefined;
    const entriesToImport = entitiesFile
      ? JSON.parse(fs.readFileSync(entitiesFile, 'utf8')).idm
      : undefined;
    for (const [id, obj] of Object.entries(importData.idm)) {
      if (entriesToImport && !entriesToImport.includes(id)) {
        delete importData.idm[id];
        continue;
      }
      const entity = envReader
        ? unSubstituteEnvParams(JSON.stringify(obj), envReader)
        : obj;
      importData.idm[id] = entity;
    }
    // Perform the import
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing config entities from ${filePath}...`
    );
    await importConfigEntities(
      importData as ConfigEntityExportInterface,
      options
    );
    stopProgressIndicator(indicatorId, `Imported config entities`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing config entities from ${filePath}.`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import all IDM configuration objects from working directory
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @param {ConfigEntityImportOptions} options import options
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importAllConfigEntitiesFromFiles(
  entitiesFile?: string,
  envFile?: string,
  options: ConfigEntityImportOptions = {
    validate: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  const baseDirectory = getWorkingDirectory();
  try {
    const importData = {
      idm: await getIdmImportDataFromIdmDirectory(
        baseDirectory,
        entitiesFile,
        envFile
      ),
    };
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing config entities from ${baseDirectory}...`
    );
    await importConfigEntities(
      importData as ConfigEntityExportInterface,
      options
    );
    stopProgressIndicator(indicatorId, `Imported config entities`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing config entities from ${baseDirectory}.`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Count number of managed objects of a given type
 * @param {String} type managed object type, e.g. alpha_user
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function countManagedObjects(type: string): Promise<boolean> {
  try {
    const result = await queryManagedObjects(type);
    printMessage(`${type}: ${result.length}`, 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Helper that reads all the idm config entity data from a directory
 * @param directory The directory of the idm config entities
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 */
export async function getIdmImportDataFromIdmDirectory(
  directory: string,
  entitiesFile?: string,
  envFile?: string
): Promise<Record<string, IdObjectSkeletonInterface>> {
  const envReader = envFile ? propertiesReader(envFile) : undefined;
  const entriesToImport = entitiesFile
    ? JSON.parse(fs.readFileSync(entitiesFile, 'utf8')).idm
    : undefined;
  const importData = {} as Record<string, IdObjectSkeletonInterface>;
  const idmConfigFiles = await readFiles(directory);
  idmConfigFiles.forEach(
    (f) => (f.path = f.path.toLowerCase().replace(/\/$/, ''))
  );
  // Process sync mapping file(s)
  if (!entriesToImport || entriesToImport.includes('sync')) {
    importData.sync = getLegacyMappingsFromFiles(idmConfigFiles, envReader);
  }
  // Process other files
  for (const f of idmConfigFiles.filter(
    (f) => !f.path.endsWith('sync.json') && f.path.endsWith('.json')
  )) {
    const entity = JSON.parse(
      envReader ? unSubstituteEnvParams(f.content, envReader) : f.content
    );
    if (!entriesToImport || entriesToImport.includes(entity._id)) {
      importData[entity._id] = entity;
    }
  }
  return importData;
}

/**
 * Helper that exports all IDM configuration objects
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {string} envFile File that defines environment specific variables for replacement during configuration export/import
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
async function exportIdmConfigEntities(
  entitiesFile?: string,
  envFile?: string
): Promise<ConfigEntityExportInterface> {
  // read list of entities to export
  let entitiesToExport: string[] = [];
  if (entitiesFile) {
    const data = fs.readFileSync(entitiesFile, 'utf8');
    const entriesData = JSON.parse(data);
    entitiesToExport = entriesData.idm;
  }

  // read list of configs to parameterize for environment specific values
  const envReplaceParams: string[][] = [];
  if (envFile) {
    const envParams = propertiesReader(envFile);
    envParams.each((key: string, value: string) => {
      envReplaceParams.push([key, value]);
    });
  }

  return await exportConfigEntities({
    entitiesToExport,
    envReplaceParams,
  });
}
