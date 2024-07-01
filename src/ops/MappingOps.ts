import { frodo, FrodoError, state } from '@rockcarver/frodo-lib';
import {
  MappingExportInterface,
  MappingExportOptions,
  MappingImportOptions,
  SyncSkeleton,
} from '@rockcarver/frodo-lib/types/ops/MappingOps';
import fs from 'fs';

import {
  createProgressIndicator,
  createTable,
  debugMessage,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const {
  getTypedFilename,
  saveJsonToFile,
  saveToFile,
  getFilePath,
  getRealmName,
  getWorkingDirectory,
  titleCase,
  unSubstituteEnvParams,
  readFiles,
} = frodo.utils;

const {
  createMapping,
  readMapping,
  importFirstMapping,
  readMappings,
  exportMapping,
  exportMappings,
  importMapping,
  importMappings,
  isLegacyMapping,
} = frodo.idm.mapping;

/**
 * List mappings
 * @param {boolean} [long=false] detailed list
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function listMappings(long: boolean = false): Promise<boolean> {
  try {
    const mappings = await readMappings();
    if (long) {
      const table = createTable([
        'Id',
        'Display Name',
        'Source',
        'Target',
        'Consent Required',
        'Is Legacy',
      ]);
      for (const mapping of mappings) {
        table.push([
          mapping._id,
          mapping.displayName,
          mapping.source,
          mapping.target,
          mapping.consentRequired ? 'yes'['brightGreen'] : 'no'['brightRed'],
          isLegacyMapping(mapping._id)
            ? 'yes'['brightGreen']
            : 'no'['brightRed'],
        ]);
      }
      printMessage(table.toString(), 'data');
    } else {
      mappings.forEach((mapping) => {
        printMessage(`${mapping._id}`, 'data');
      });
    }
    return true;
  } catch (error) {
    printError(error, `Error listing mappings`);
  }
  return false;
}

/**
 * Export mapping to file
 * @param {string} mappingId mapping id/name
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {MappingExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportMappingToFile(
  mappingId: string,
  file: string,
  includeMeta: boolean = true,
  options: MappingExportOptions = {
    deps: true,
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportMapping(mappingId, options);
    let fileName = getTypedFilename(
      getMappingNameFromId(mappingId),
      getMappingTypeFromId(mappingId)
    );
    if (file) {
      fileName = file;
    }
    saveJsonToFile(exportData, getFilePath(fileName, true), includeMeta);
    return true;
  } catch (error) {
    printError(error, `Error exporting mapping ${mappingId} to file`);
  }
  return false;
}

/**
 * Export all mappings to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {MappingExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportMappingsToFile(
  file: string,
  includeMeta: boolean = true,
  options: MappingExportOptions = {
    deps: true,
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportMappings(options);
    let fileName = getTypedFilename(
      `all${titleCase(getRealmName(state.getRealm()))}Mappings`,
      'mapping'
    );
    if (file) {
      fileName = file;
    }
    saveJsonToFile(exportData, getFilePath(fileName, true), includeMeta);
    return true;
  } catch (error) {
    printError(error, `Error exporting mappings to file`);
  }
  return false;
}

/**
 * Export all mappings to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {MappingExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportMappingsToFiles(
  includeMeta: boolean = true,
  options: MappingExportOptions = {
    deps: true,
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportMappings(options);
    for (const mapping of Object.values(exportData.mapping)) {
      const fileName = getTypedFilename(
        mapping.name,
        getMappingTypeFromId(mapping._id)
      );
      saveToFile(
        getMappingTypeFromId(mapping._id),
        mapping,
        '_id',
        getFilePath('mapping/' + fileName, true),
        includeMeta
      );
    }
    writeSyncJsonToDirectory(exportData.sync);
    return true;
  } catch (error) {
    printError(error, `Error exporting mappings to files`);
  }
  return false;
}

/**
 * Import a mapping from file
 * @param {string} mappingId mapping id/name
 * @param {string} file import file name
 * @param {MappingImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importMappingFromFile(
  mappingId: string,
  file: string,
  options: MappingImportOptions = { deps: true }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'determinate',
      1,
      'Importing mapping...'
    );
    const data = fs.readFileSync(getFilePath(file), 'utf8');
    const mappingExport: MappingExportInterface = JSON.parse(data);
    await importMapping(mappingId, mappingExport, options);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported mapping ${mappingId}.`
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing mapping ${mappingId}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import mappings from file
 * @param {String} file file name
 * @param {MappingImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importMappingsFromFile(
  file: string,
  options: MappingImportOptions = { deps: true }
): Promise<boolean> {
  try {
    debugMessage(`importMappingsFromFile: start`);
    const filePath = getFilePath(file);
    const data = fs.readFileSync(filePath, 'utf8');
    debugMessage(`importMappingsFromFile: importing ${filePath}`);
    const importData = JSON.parse(data) as MappingExportInterface;
    await importMappings(importData, options);
    debugMessage(`importMappingsFromFile: end`);
    return true;
  } catch (error) {
    printError(error, `Error importing mappings from file`);
  }
  return false;
}

/**
 * Import all mappings from separate files
 * @param {MappingImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importMappingsFromFiles(
  options: MappingImportOptions = { deps: true }
): Promise<boolean> {
  try {
    const workingDirectory = getWorkingDirectory();
    const allMappingFiles = (await readFiles(workingDirectory)).filter(
      (f) =>
        f.path.toLowerCase().endsWith('mapping.json') ||
        f.path.toLowerCase().endsWith('sync.json')
    );
    const mapping = Object.fromEntries(
      allMappingFiles
        .filter((f) => f.path.toLowerCase().endsWith('mapping.json'))
        .map((f) => JSON.parse(f.content))
        .map((m) => [m._id, m])
    );
    await importMappings(
      {
        mapping,
        sync: getLegacyMappingsFromFiles(allMappingFiles),
      },
      options
    );
    return true;
  } catch (error) {
    printError(error, `Error importing mappings from files`);
  }
  return false;
}

/**
 * Import first mapping from file
 * @param {string} file import file name
 * @param {MappingImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstMappingFromFile(
  file: string,
  options: MappingImportOptions = { deps: true }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'determinate',
      1,
      'Importing mapping...'
    );
    const data = fs.readFileSync(getFilePath(file), 'utf8');
    const mappingExport: MappingExportInterface = JSON.parse(data);
    await importFirstMapping(mappingExport, options);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported first mapping from ${file}.`
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing mapping from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete mapping
 * @param {string} mappingId mapping id/name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteMapping(mappingId: string): Promise<boolean> {
  try {
    await frodo.idm.mapping.deleteMapping(mappingId);
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Delete mappings
 * @param {string} connectorId limit mappings to connector
 * @param {string} moType limit mappings to managed object type
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteMappings(
  connectorId?: string,
  moType?: string
): Promise<boolean> {
  try {
    await frodo.idm.mapping.deleteMappings(connectorId, moType);
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Rename mapping
 * @param {string} mappingId mapping id/name
 * @param {boolean} [legacy=false] true to rename from new to legacy naming scheme, false otherwise. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function renameMapping(
  mappingId: string,
  legacy: boolean = false
): Promise<boolean> {
  const name = getMappingNameFromId(mappingId);
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Renaming mapping ${name}...`
  );
  try {
    const oldId = `${legacy ? 'mapping' : 'sync'}/${name}`;
    const newId = `${legacy ? 'sync' : 'mapping'}/${name}`;
    const oldMapping = await readMapping(oldId);
    oldMapping._id = newId;
    await createMapping(newId, oldMapping);
    await frodo.idm.mapping.deleteMapping(oldId);
    stopProgressIndicator(
      spinnerId,
      `Successfully renamed ${name} to ${
        legacy ? 'legacy' : 'new'
      } naming scheme.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      spinnerId,
      error.response ? `Error renaming mapping ${name}` : error,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Rename all mappings
 * @param {boolean} [legacy=false] true to rename from new to legacy naming scheme, false otherwise. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function renameMappings(
  legacy: boolean = false
): Promise<boolean> {
  const mappings = await readMappings();
  const spinnerId = createProgressIndicator(
    'determinate',
    mappings.length,
    `Renaming mappings...`
  );
  for (const mapping of mappings) {
    const name = mapping.name;
    try {
      updateProgressIndicator(spinnerId, `Renaming mapping ${name}...`);
      const oldId = `${legacy ? 'mapping' : 'sync'}/${name}`;
      const newId = `${legacy ? 'sync' : 'mapping'}/${name}`;
      let oldMapping;
      try {
        oldMapping = await readMapping(oldId);
      } catch (error) {
        // Old mapping doesn't exist, meaning the mapping is already new, so just ignore it.
        continue;
      }
      await createMapping(newId, oldMapping);
      await frodo.idm.mapping.deleteMapping(oldId);
    } catch (error) {
      stopProgressIndicator(
        spinnerId,
        error.response ? `Error renaming mapping ${name}` : error,
        'fail'
      );
      printError(error);
      return false;
    }
  }
  stopProgressIndicator(
    spinnerId,
    `Successfully renamed ${mappings.length} mappings to ${
      legacy ? 'legacy' : 'new'
    } naming scheme.`,
    'success'
  );
  return true;
}

/**
 * Helper that writes mappings in a sync.json config entity to a directory
 * @param sync The sync.json config entity
 * @param directory The directory to save the mappings
 */
export function writeSyncJsonToDirectory(
  sync: SyncSkeleton,
  directory?: string
) {
  let directoryName = 'sync';
  if (directory) {
    directoryName = directory;
  }
  const mappingPaths = [];
  for (const mapping of sync.mappings) {
    const filePath = getFilePath(
      `${directoryName}/${getTypedFilename(mapping.name, 'sync')}`,
      true
    );
    mappingPaths.push(`file://${filePath}`);
    saveJsonToFile(mapping, filePath, false);
  }
  sync.mappings = mappingPaths;
  saveJsonToFile(sync, getFilePath(`${directoryName}/sync.json`, true));
}

export function getLegacyMappingsFromFiles(files, envReader?) {
  const syncFiles = files.filter((f) => f.path.endsWith('/sync.json'));
  if (syncFiles.length > 1) {
    throw new FrodoError('Multiple sync.json files found in idm directory');
  }
  const sync = {
    _id: 'sync',
    mappings: [],
  };
  if (syncFiles.length === 1) {
    const syncData = JSON.parse(
      envReader
        ? unSubstituteEnvParams(syncFiles[0].content, envReader)
        : syncFiles[0].content
    );
    if (syncData.mappings) {
      for (const mapping of syncData.mappings) {
        if (typeof mapping === 'string') {
          const path = mapping.replace('file://', '');
          const content = fs.readFileSync(path, 'utf8');
          sync.mappings.push(
            JSON.parse(
              envReader ? unSubstituteEnvParams(content, envReader) : content
            )
          );
        } else {
          sync.mappings.push(mapping);
        }
      }
    }
  }
  return sync;
}

/**
 * Helper that gets a mapping's type (either 'sync' or 'mapping') from it's id
 * @param {string} mappingId the mapping id
 * @returns {string} the mapping type
 */
export function getMappingTypeFromId(mappingId: string): string {
  return isLegacyMapping(mappingId) ? 'sync' : 'mapping';
}

/**
 * Helper that returns the mapping name given the mapping's id.
 * @param {string} mappingId the mapping id
 * @returns {string} the mapping name
 */
export function getMappingNameFromId(mappingId: string): string | undefined {
  if (!mappingId) {
    return undefined;
  }
  return mappingId.startsWith('mapping/') || mappingId.startsWith('sync/')
    ? mappingId.substring(mappingId.indexOf('/') + 1)
    : mappingId;
}
