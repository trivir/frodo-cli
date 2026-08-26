import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { type IdObjectSkeletonInterface } from '@rockcarver/frodo-lib/types/api/ApiTypes';
import {
  type ManagedObjectSchema,
  type ManagedObjectSchemaProperty,
} from '@rockcarver/frodo-lib/types/api/ManagedObjectApi';
import { type ConfigEntityExportInterface } from '@rockcarver/frodo-lib/types/ops/IdmConfigOps';
import {
  MappingSkeleton,
  SyncSkeleton,
} from '@rockcarver/frodo-lib/types/ops/MappingOps';
import fs from 'fs';
import path from 'path';
import yesno from 'yesno';

import {
  extractDataToFile,
  getExtractedData,
  getExtractedJsonData,
} from '../utils/Config';
import {
  createObjectTable,
  createProgressIndicator,
  createTable,
  printError,
  printMessage,
  stopProgressIndicator,
} from '../utils/Console';
import {
  getLegacyMappingsFromFiles,
  writeMappingJsonToDirectory,
  writeSyncJsonToDirectory,
} from './MappingOps';
import { errorHandler } from './utils/OpsUtils';

const {
  getFilePath,
  getTypedFilename,
  readFiles,
  getWorkingDirectory,
  saveJsonToFile,
  saveToFile,
  titleCase,
} = frodo.utils;

const {
  readConfigEntities,
  exportConfigEntity,
  exportConfigEntities,
  deleteConfigEntity,
  importConfigEntities,
  readSubConfigEntity,
  importSubConfigEntity,
  removeSubConfigEntity,
} = frodo.idm.config;
const { countManagedObjects: countManagedObjectsOfType } = frodo.idm.managed;
const {
  readManagedObjectSchema,
  readManagedObjectSchemaProperty,
  updateManagedObjectSchemaProperty,
  removeManagedObjectSchemaProperty,
} = frodo.idm.managed.schema;
const { testConnectorServers } = frodo.idm.system;

type MatchResult = { path: string; source: string; type: string };

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

type ObjectSkeleton = IdObjectSkeletonInterface & {
  name: string;
};

export type ManagedSkeleton = IdObjectSkeletonInterface & {
  objects: ObjectSkeleton[];
};

type ManagedObjectTypeConfig = ObjectSkeleton & {
  schema?: ManagedObjectSchema;
};

/**
 * Export an IDM configuration object.
 * @param {string} id the desired configuration object
 * @param {string} file optional export file name (or directory name if exporting mappings separately)
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract true to extract idm scripts, false otherwise. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportConfigEntityToFile(
  id: string,
  file?: string,
  includeMeta: boolean = true,
  extract: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportConfigEntity(id);
    if (!extract) {
      const fileName = file || getTypedFilename(`${id}`, 'idm');
      saveJsonToFile(exportData, getFilePath(fileName, true), includeMeta);
      return true;
    }
    if (id === 'sync') {
      writeSyncJsonToDirectory(
        exportData.idm[id] as SyncSkeleton,
        'sync',
        includeMeta,
        extract
      );
      return true;
    }
    if (id === 'managed') {
      writeManagedJsonToDirectory(
        exportData.idm[id] as ManagedSkeleton,
        'managed',
        includeMeta,
        extract
      );
      return true;
    }
    writeIdmObjectToDirectory(exportData.idm[id], '.', includeMeta, extract);
    return true;
  } catch (error) {
    printError(error, `Error exporting config entity ${id}`);
  }
  return false;
}

/**
 * Export an IDM configuration managed object.
 * @param {string} name the desired configuration object
 * @param {string} file optional export file name
 * @param {boolean} extract true to extract idm scripts, false otherwise. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportManagedObjectToFile(
  name: string,
  file?: string,
  extract: boolean = false
): Promise<boolean> {
  try {
    const exportData = (await readSubConfigEntity(
      'managed',
      name
    )) as ObjectSkeleton;
    if (extract && extractManagedObjectScriptsToDirectory(exportData)) {
      const fileName = getTypedFilename(name, 'managed');
      saveJsonToFile(
        exportData,
        getFilePath(`${name}/${fileName}`, true),
        false
      );
      return true;
    }
    const fileName = file || getTypedFilename(name, 'managed');
    saveJsonToFile(exportData, getFilePath(fileName, true), false);
    return true;
  } catch (error) {
    printError(error, `Error exporting config managed object ${name}`);
  }
  return false;
}

/**
 * Export all IDM configuration objects
 * @param {string} file file to export to
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportAllConfigEntitiesToFile(
  file?: string,
  entitiesFile?: string,
  includeMeta: boolean = true
): Promise<boolean> {
  try {
    const options = getIdmImportExportOptions(entitiesFile);
    const exportData = await exportConfigEntities(
      {
        entitiesToExport: options.entitiesToExportOrImport,
      },
      errorHandler
    );
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
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract true to extract idm scripts, false otherwise. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function exportAllConfigEntitiesToFiles(
  entitiesFile?: string,
  includeMeta: boolean = true,
  extract: boolean = false
): Promise<boolean> {
  const errors: Error[] = [];
  try {
    const options = getIdmImportExportOptions(entitiesFile);
    const exportData = await exportConfigEntities(
      {
        entitiesToExport: options.entitiesToExportOrImport,
      },
      errorHandler
    );
    for (const [id, obj] of Object.entries(exportData.idm)) {
      if (!obj) continue;
      try {
        if (!extract) {
          saveToFile(
            'idm',
            obj,
            '_id',
            getFilePath(`${id}.idm.json`, true),
            includeMeta
          );
          continue;
        }
        if (id === 'sync') {
          writeSyncJsonToDirectory(
            obj as SyncSkeleton,
            'sync',
            includeMeta,
            extract
          );
          continue;
        }
        if (id === 'managed') {
          writeManagedJsonToDirectory(
            obj as ManagedSkeleton,
            'managed',
            includeMeta,
            extract
          );
          continue;
        }
        if (id.startsWith('mapping/')) {
          writeMappingJsonToDirectory(
            obj as MappingSkeleton,
            'mapping',
            includeMeta,
            extract
          );
          continue;
        }
        writeIdmObjectToDirectory(obj, '.', includeMeta, extract);
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
 * @param {boolean} validate True to validate script hooks. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importConfigEntityByIdFromFile(
  entityId: string,
  file?: string,
  validate: boolean = false
): Promise<boolean> {
  try {
    if (!file) {
      file = getTypedFilename(entityId, 'idm');
    }
    const filePath = getFilePath(file);

    const fileData = fs.readFileSync(
      path.resolve(process.cwd(), filePath),
      'utf8'
    );

    let importData;
    if (entityId === 'sync') {
      const syncData = getLegacyMappingsFromFiles([
        {
          content: fileData,
          path: `${filePath.substring(0, filePath.lastIndexOf('/'))}/sync.idm.json`,
        },
      ]);
      importData = { idm: { sync: syncData } };
    } else if (entityId === 'managed') {
      const managedData = getManagedObjectsFromFiles([
        {
          content: fileData,
          path: `${filePath.substring(0, filePath.lastIndexOf('/'))}/managed.idm.json`,
        },
      ]);
      importData = { idm: { managed: managedData } };
    } else {
      importData = JSON.parse(fileData);
      const entity = importData.idm?.[entityId];
      if (entity) {
        const baseDir = path.dirname(filePath);
        resolveAllExtractedScriptsForImport(entity, baseDir);
        importData.idm[entityId] = entity;
      }
    }

    await importConfigEntities(
      importData,
      entityId,
      {
        entitiesToImport: undefined,
        validate,
      },
      errorHandler
    );
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Delete IDM config Entity by id
 * @param {String} id saml entityId
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteConfigEntityById(
  entityId: string
): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting ${entityId}...`
  );
  try {
    await deleteConfigEntity(entityId);
    stopProgressIndicator(spinnerId, `Deleted ${entityId}.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Import first IDM configuration object from file.
 * @param {string} file optional file to import
 * @param {boolean} validate True to validate script hooks. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importFirstConfigEntityFromFile(
  file: string,
  validate: boolean = false
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

    const parsed = JSON.parse(fileData);
    const allEntities = Object.entries(parsed.idm)
      .filter(([id]) => id !== 'meta')
      .map(([, val]) => val) as IdObjectSkeletonInterface[];

    if (allEntities.length === 0) {
      stopProgressIndicator(indicatorId, `No items to import.`, 'success');
      return true;
    }

    const entity = allEntities[0];
    const entityId = entity._id;

    const baseDir = path.dirname(filePath);
    resolveAllExtractedScriptsForImport(entity, baseDir);

    const importData: ConfigEntityExportInterface = {
      idm: { [entityId]: entity },
    };

    if (entityId === 'sync') {
      importData.idm.sync = getLegacyMappingsFromFiles([
        {
          content: fileData,
          path: `${baseDir}/sync.idm.json`,
        },
      ]);
    }

    if (entityId === 'managed') {
      importData.idm.managed = getManagedObjectsFromFiles([
        {
          content: fileData,
          path: `${baseDir}/managed.idm.json`,
        },
      ]);
    }

    await importConfigEntities(
      importData,
      entityId,
      {
        entitiesToImport: undefined,
        validate,
      },
      errorHandler
    );
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
 * @param {boolean} validate True to validate script hooks. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importAllConfigEntitiesFromFile(
  file: string,
  entitiesFile?: string,
  validate: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  let filePath;
  try {
    filePath = getFilePath(file);
    const baseDir = path.dirname(filePath);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    resolveAllExtractedScriptsForImport(importData, baseDir);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing config entities from ${filePath}...`
    );
    const options = getIdmImportExportOptions(entitiesFile);
    await importConfigEntities(
      importData as ConfigEntityExportInterface,
      undefined,
      {
        entitiesToImport: options.entitiesToExportOrImport,
        validate,
      },
      errorHandler
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
 * Identifies which incoming managed-object type entries carry a schema
 * definition, to gate schema-bearing 'frodo idm schema object import'
 * calls behind an explicit confirmation before writing. Managed-object
 * CONFIGURATION (this command) is a superset of managed-object SCHEMA
 * (each object entry's own .schema key) — most configuration edits
 * (notifications, meta, etc.) don't touch schema at all, so this only
 * flags the subset of incoming objects that carry a schema.
 *
 * Deliberately does not compare against the live tenant's current schema
 * (which would need an extra read per type): a type carrying a schema key
 * is flagged whether or not that schema would actually change anything,
 * trading a small amount of false-positive friction for not depending on
 * an extra live read succeeding to make the correct safety call. Does not
 * read or write anything itself; pure/synchronous over the parsed import
 * data already in hand.
 * @param {{name: string; schema?: unknown}[]} objects incoming managed-object type entries about to be imported
 * @returns {string[]} the object type names that carry a schema definition
 */
export function getSchemaBearingObjectNames(
  objects: { name: string; schema?: unknown }[]
): string[] {
  return objects.filter((object) => object.schema).map((object) => object.name);
}

/**
 * Import an individual managed object from a file
 * @param {string} file the file containing the managed object
 * @param {boolean} validate True to validate script hooks. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importManagedObjectFromFile(
  file: string,
  validate: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  let filePath: string;
  try {
    filePath = getFilePath(file);
    const fileData = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(fileData);
    const baseDir = path.dirname(filePath);
    resolveAllExtractedScriptsForImport(importData, baseDir);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing config managed object from ${filePath}...`
    );
    const options = getIdmImportExportOptions(undefined);
    await importSubConfigEntity('managed', importData, {
      entitiesToImport: options.entitiesToExportOrImport,
      validate,
    });

    stopProgressIndicator(
      indicatorId,
      `Imported config managed object`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing config managed object from ${filePath}.`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Read and parse a local JSON file (e.g. a schema property definition or a
 * full managed-object type definition).
 * @param {string} file file to read
 * @return {unknown} the parsed JSON content
 */
function readJsonFile(file: string): unknown {
  const filePath = getFilePath(file);
  const fileData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileData);
}

/**
 * Prints a warning and asks for confirmation before a schema-affecting
 * change, unless skipConfirmation is set. Refuses (rather than hanging on a
 * readline call with nowhere to read from) if stdin isn't an interactive
 * terminal and skipConfirmation wasn't passed. Mirrors the confirmation gate
 * `frodo idm schema object import` already uses.
 * @param {string} warning warning message printed before the prompt
 * @param {string} question the yes/no question to prompt
 * @param {boolean} skipConfirmation true to skip the prompt and proceed
 * @return {Promise<boolean>} a promise that resolves to true if the change should proceed
 */
async function confirmChange(
  warning: string,
  question: string,
  skipConfirmation: boolean
): Promise<boolean> {
  printMessage(warning, 'warn');
  if (skipConfirmation) {
    return true;
  }
  if (!process.stdin.isTTY) {
    printMessage(
      '\nRefusing to prompt for confirmation without an interactive terminal. Pass -y/--yes to proceed non-interactively.',
      'error'
    );
    return false;
  }
  return yesno({ question });
}

/**
 * Checks whether a managed object type is currently defined, by reading the
 * whole `managed` config entity and checking membership. Deliberately does
 * not infer absence from a caught read failure — a transient/permission
 * failure reading the whole `managed` entity must not be misclassified as
 * "type not found" (the exact anti-pattern behind the tracker's
 * isNotFound/create-fallback finding); any such failure propagates instead.
 * @param {string} type managed object type name
 * @return {Promise<boolean>} a promise that resolves to true if the type exists
 */
async function managedObjectTypeExists(type: string): Promise<boolean> {
  const managedConfig = (await frodo.idm.config.readConfigEntity(
    'managed'
  )) as IdObjectSkeletonInterface & { objects?: ObjectSkeleton[] };
  return (managedConfig.objects || []).some((object) => object.name === type);
}

/**
 * Sets or replaces a schema property definition on a managed-object type
 * config (as returned by readSubConfigEntity('managed', type)), keeping the
 * top-level schema.required/order arrays in sync.
 */
function setSchemaProperty(
  typeConfig: ManagedObjectTypeConfig,
  propertyName: string,
  propertyData: ManagedObjectSchemaProperty
): void {
  if (!typeConfig.schema) {
    throw new FrodoError(
      `Managed type "${typeConfig.name}" has no schema definition`
    );
  }
  typeConfig.schema.properties = {
    ...typeConfig.schema.properties,
    [propertyName]: propertyData,
  };
  const required = new Set(typeConfig.schema.required || []);
  if ((propertyData as { required?: boolean }).required) {
    required.add(propertyName);
  } else {
    required.delete(propertyName);
  }
  typeConfig.schema.required = Array.from(required);
  if (!(typeConfig.schema.order || []).includes(propertyName)) {
    typeConfig.schema.order = [
      ...(typeConfig.schema.order || []),
      propertyName,
    ];
  }
}

/**
 * Removes a schema property definition (and its required/order bookkeeping)
 * from a managed-object type config.
 */
function removeSchemaProperty(
  typeConfig: ManagedObjectTypeConfig,
  propertyName: string
): void {
  if (!typeConfig.schema) {
    return;
  }
  const properties = { ...typeConfig.schema.properties };
  delete properties[propertyName];
  typeConfig.schema.properties = properties;
  typeConfig.schema.required = (typeConfig.schema.required || []).filter(
    (name) => name !== propertyName
  );
  typeConfig.schema.order = (typeConfig.schema.order || []).filter(
    (name) => name !== propertyName
  );
}

/**
 * List the schema properties of a managed object type.
 * @param {string} type managed object type, e.g. alpha_user
 * @param {boolean} json true to print raw JSON instead of a table
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function listManagedObjectSchemaProperties(
  type: string,
  json: boolean = false
): Promise<boolean> {
  try {
    const schema = await readManagedObjectSchema(type);
    if (json) {
      printMessage(JSON.stringify(schema.properties, null, 2), 'data');
      return true;
    }
    const table = createTable([
      'Name',
      'Type',
      'Title',
      'Required',
      'Searchable',
      'User Editable',
      'Viewable',
    ]);
    const required = new Set(schema.required || []);
    Object.entries(schema.properties || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name, property]) => {
        table.push([
          name,
          property.type,
          property.title || '',
          required.has(name) ? 'yes' : 'no',
          property.searchable ? 'yes' : 'no',
          property.userEditable ? 'yes' : 'no',
          property.viewable ? 'yes' : 'no',
        ]);
      });
    printMessage(table.toString(), 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Describe a single schema property of a managed object type.
 * @param {string} type managed object type, e.g. alpha_user
 * @param {string} propertyName schema property name, e.g. custom_merchantId
 * @param {boolean} json true to print raw JSON instead of a table
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function describeManagedObjectSchemaProperty(
  type: string,
  propertyName: string,
  json: boolean = false
): Promise<boolean> {
  try {
    const schema = await readManagedObjectSchema(type);
    const property = schema.properties?.[propertyName];
    if (!property) {
      printError(
        new FrodoError(
          `Schema property "${propertyName}" not found on managed type "${type}"`
        )
      );
      return false;
    }
    if (json) {
      printMessage(JSON.stringify(property, null, 2), 'data');
      return true;
    }
    printMessage(createObjectTable(property).toString(), 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Create a new schema property on a managed object type. Refuses if a
 * property with that name already exists (use update instead). Applies to
 * any deployment type — this reads and rewrites the whole type definition,
 * the same mechanism `frodo idm schema object export/import` already use,
 * regardless of the new property's type (relationship properties included).
 * @param {string} type managed object type, e.g. alpha_user
 * @param {string} propertyName schema property name, e.g. custom_merchantId
 * @param {string} file file containing the property definition to create
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function createManagedObjectSchemaProperty(
  type: string,
  propertyName: string,
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    const propertyData = readJsonFile(file) as ManagedObjectSchemaProperty;
    const typeConfig = (await readSubConfigEntity(
      'managed',
      type
    )) as ManagedObjectTypeConfig;
    if (typeConfig.schema?.properties?.[propertyName]) {
      printError(
        new FrodoError(
          `Schema property "${propertyName}" already exists on managed type "${type}". Use update instead.`
        )
      );
      return false;
    }
    setSchemaProperty(typeConfig, propertyName, propertyData);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Creating schema property ${propertyName} on ${type}...`
    );
    await importSubConfigEntity('managed', typeConfig, { validate: false });
    stopProgressIndicator(
      indicatorId,
      `Created schema property ${propertyName} on ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error creating schema property ${propertyName} on ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Update an existing schema property on a managed object type. Refuses if
 * the property doesn't exist (use create instead). Prints a Current/
 * Proposed diff and prompts for confirmation unless skipConfirmation is set.
 * @param {string} type managed object type, e.g. alpha_user
 * @param {string} propertyName schema property name, e.g. custom_merchantId
 * @param {string} file file containing the updated property definition
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function updateManagedObjectSchemaPropertyCli(
  type: string,
  propertyName: string,
  file: string,
  skipConfirmation: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  try {
    const propertyData = readJsonFile(file) as ManagedObjectSchemaProperty;
    const typeConfig = (await readSubConfigEntity(
      'managed',
      type
    )) as ManagedObjectTypeConfig;
    const current = typeConfig.schema?.properties?.[propertyName];
    if (!current) {
      printError(
        new FrodoError(
          `Schema property "${propertyName}" not found on managed type "${type}". Use create instead.`
        )
      );
      return false;
    }
    const warning = `\nCurrent:\n${JSON.stringify(current, null, 2)}\n\nProposed:\n${JSON.stringify(propertyData, null, 2)}`;
    if (
      !(await confirmChange(
        warning,
        `\nUpdate schema property "${propertyName}" on managed type "${type}"? This affects every existing and future record of that type. Continue? (y|n):`,
        skipConfirmation
      ))
    ) {
      printMessage('Update aborted.', 'warn');
      return false;
    }
    setSchemaProperty(typeConfig, propertyName, propertyData);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Updating schema property ${propertyName} on ${type}...`
    );
    await importSubConfigEntity('managed', typeConfig, { validate: false });
    stopProgressIndicator(
      indicatorId,
      `Updated schema property ${propertyName} on ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error updating schema property ${propertyName} on ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Delete a schema property from a managed object type. Prompts for
 * confirmation unless skipConfirmation is set.
 * @param {string} type managed object type, e.g. alpha_user
 * @param {string} propertyName schema property name, e.g. custom_merchantId
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function deleteManagedObjectSchemaPropertyCli(
  type: string,
  propertyName: string,
  skipConfirmation: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  try {
    const typeConfig = (await readSubConfigEntity(
      'managed',
      type
    )) as ManagedObjectTypeConfig;
    const current = typeConfig.schema?.properties?.[propertyName];
    if (!current) {
      printError(
        new FrodoError(
          `Schema property "${propertyName}" not found on managed type "${type}"`
        )
      );
      return false;
    }
    const warning = `\nThis will permanently remove the following schema property definition from managed type "${type}":\n${JSON.stringify(current, null, 2)}\n\nThis removes the property from the schema only — it does not purge any values already stored for it on existing records.`;
    if (
      !(await confirmChange(
        warning,
        `\nDelete schema property "${propertyName}" from managed type "${type}"? This affects every existing and future record of that type. Continue? (y|n):`,
        skipConfirmation
      ))
    ) {
      printMessage('Delete aborted.', 'warn');
      return false;
    }
    removeSchemaProperty(typeConfig, propertyName);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Deleting schema property ${propertyName} from ${type}...`
    );
    await importSubConfigEntity('managed', typeConfig, { validate: false });
    stopProgressIndicator(
      indicatorId,
      `Deleted schema property ${propertyName} from ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error deleting schema property ${propertyName} from ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Field values for a relationship schema property, as resolved from CLI
 * flags. Used both for `create` (fully specified) and `update` (only the
 * explicitly-passed subset, merged onto the property's current definition).
 */
export type RelationshipPropertyFields = {
  targetObject?: string;
  many?: boolean;
  queryFields?: string[];
  title?: string;
  description?: string;
  label?: string;
  queryFilter?: string;
  sortKeys?: string[];
  notify?: boolean;
  notifySelf?: boolean;
  searchable?: boolean;
  userEditable?: boolean;
  notViewable?: boolean;
  notValidate?: boolean;
  returnByDefault?: boolean;
  reversePropertyName?: string;
};

/** Field values for the reverse side of a bidirectional `create`. */
export type RelationshipReverseCreateFields = {
  propertyName: string;
  many: boolean;
  queryFields: string[];
  title?: string;
  description?: string;
};

/**
 * Turns a property name like "widgetSize" or "custom_merchantId" into a
 * human-readable default title ("Widget Size", "Custom Merchant Id") when
 * the caller didn't pass an explicit --title.
 */
function humanizePropertyName(propertyName: string): string {
  const spaced = propertyName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return titleCase(spaced);
}

/**
 * The `_ref`/`_refProperties` sub-schema every relationship property carries.
 * Confirmed structurally identical (only the `_refProperties.title` label
 * varies, derived from the property's own title) across all 70 relationship
 * properties surveyed live on volker-dev -- hardcoded here rather than
 * exposed as a flag.
 */
function buildRelationshipRefProperties(
  effectiveTitle: string
): Record<string, unknown> {
  return {
    _ref: {
      type: 'string',
      description: 'References a relationship from a managed object',
    },
    _refProperties: {
      type: 'object',
      description: 'Supports metadata within the relationship',
      title: `${effectiveTitle} _refProperties`,
      properties: {
        _id: { type: 'string', description: '_refProperties object ID' },
      },
    },
  };
}

/**
 * Describes the reverse side for the v2 API's single-call bidirectional
 * auto-creation mechanism: embedding this descriptor in the forward side's
 * own `resourceCollection[0].reverseProperty` makes the server create the
 * reverse property itself, in the same write that creates the forward
 * side -- live-confirmed against volker-dev to work for all four
 * single/many combinations on both sides (this is also the definitive,
 * live-confirmed answer to whether the v2 API auto-creates the reverse
 * side: yes, given this descriptor; without it, `reverseRelationship: true`
 * is rejected outright with a 400, "field is required"). The server does
 * NOT honor a custom title/description here -- the auto-created property
 * always gets the raw property name for both, live-confirmed -- but they're
 * still passed through for forward compatibility in case that changes;
 * `--reverse-title`/`--reverse-description` are documented accordingly.
 */
function buildReversePropertyDescriptor(
  reverse: RelationshipReverseCreateFields
): Record<string, unknown> {
  return {
    type: reverse.many ? 'array' : 'relationship',
    ...(reverse.title && { title: reverse.title }),
    ...(reverse.description && { description: reverse.description }),
    validate: true,
    resourceCollection: {
      notify: false,
      query: { fields: reverse.queryFields, queryFilter: 'true' },
    },
  };
}

function buildRelationshipResourceCollectionItem(
  fields: RelationshipPropertyFields,
  reverse?: RelationshipReverseCreateFields
): Record<string, unknown> {
  return {
    label: fields.label || humanizePropertyName(fields.targetObject),
    notify: !!fields.notify,
    path: `managed/${fields.targetObject}`,
    ...(reverse && {
      reverseProperty: buildReversePropertyDescriptor(reverse),
    }),
    query: {
      fields: fields.queryFields,
      queryFilter: fields.queryFilter || 'true',
      ...(fields.sortKeys ? { sortKeys: fields.sortKeys } : {}),
    },
  };
}

/**
 * Assembles a full relationship (or array-of-relationship) schema-property
 * payload from resolved field values, applying this tracker item's
 * empirically-derived defaults (see the implementation plan for the full
 * justification table from a live survey of 70 relationship properties on
 * volker-dev): `validate`/`viewable` default true, `userEditable`/
 * `returnByDefault`/`notifySelf`/resourceCollection `notify` default false,
 * `queryFilter` defaults `'true'`, and `searchable`/`sortKeys` are omitted
 * entirely unless explicitly passed. `reverse`, when given (create only),
 * embeds a reverse-property descriptor that makes the server auto-create
 * the reverse side in the same write -- see
 * {@link buildReversePropertyDescriptor}.
 *
 * Built as a plain object and cast at the call site rather than typed as
 * `ManagedObjectSchemaProperty` throughout: the real IDM v2 API is more
 * lenient than that type declares (`sortKeys`/`searchable` in particular are
 * routinely absent from real property definitions returned by the server).
 */
function buildRelationshipPropertyPayload(
  propertyName: string,
  fields: RelationshipPropertyFields,
  reverse?: RelationshipReverseCreateFields
): Record<string, unknown> {
  const title = fields.title || humanizePropertyName(propertyName);
  const itemsTitle = `${title} Items`;
  const effectiveTitle = fields.many ? itemsTitle : title;

  const relationshipCore: Record<string, unknown> = {
    id: propertyName,
    type: 'relationship',
    ...(fields.many && { title: itemsTitle }),
    properties: buildRelationshipRefProperties(effectiveTitle),
    resourceCollection: [
      buildRelationshipResourceCollectionItem(fields, reverse),
    ],
    reverseRelationship: !!fields.reversePropertyName,
    ...(fields.reversePropertyName && {
      reversePropertyName: fields.reversePropertyName,
    }),
    validate: !fields.notValidate,
    notifySelf: !!fields.notifySelf,
  };

  const baseFields: Record<string, unknown> = {
    title,
    ...(fields.description && { description: fields.description }),
    viewable: !fields.notViewable,
    userEditable: !!fields.userEditable,
    returnByDefault: !!fields.returnByDefault,
    ...(fields.searchable !== undefined && { searchable: fields.searchable }),
  };

  if (!fields.many) {
    return { ...relationshipCore, ...baseFields };
  }
  return { type: 'array', ...baseFields, items: relationshipCore };
}

/**
 * Reverse-parses a live relationship (or array-of-relationship) property
 * definition back into `RelationshipPropertyFields`, so `update` can merge
 * only the explicitly-passed CLI overrides onto the property's actual
 * current state rather than the create-time defaults.
 */
function extractRelationshipFields(
  current: Record<string, unknown>
): RelationshipPropertyFields {
  const many = current.type === 'array';
  const rel = (many ? current.items : current) as Record<string, unknown>;
  const base = many ? current : rel;
  const resourceCollection = (
    rel.resourceCollection as Array<Record<string, unknown>>
  )?.[0];
  const query = resourceCollection?.query as
    Record<string, unknown> | undefined;
  const path = resourceCollection?.path as string | undefined;
  return {
    targetObject: path?.startsWith('managed/')
      ? path.slice('managed/'.length)
      : undefined,
    many,
    queryFields: (query?.fields as string[]) || [],
    title: base.title as string | undefined,
    description: base.description as string | undefined,
    label: resourceCollection?.label as string | undefined,
    queryFilter: query?.queryFilter as string | undefined,
    sortKeys: query?.sortKeys as string[] | undefined,
    notify: !!resourceCollection?.notify,
    notifySelf: !!rel.notifySelf,
    searchable: base.searchable as boolean | undefined,
    userEditable: !!base.userEditable,
    notViewable: base.viewable === false,
    notValidate: rel.validate === false,
    returnByDefault: !!base.returnByDefault,
    reversePropertyName: rel.reversePropertyName as string | undefined,
  };
}

/**
 * Turns an already-fetched relationship property's extracted fields into the
 * descriptor shape `buildRelationshipPropertyPayload`'s `reverse` parameter
 * expects. Used on `update`: the v2 API requires a
 * `resourceCollection[0].reverseProperty` descriptor on *every* write of a
 * property that has `reverseRelationship: true` set, not just its initial
 * creation -- live-confirmed via a 400 ("field is required") when updating
 * an already-bidirectional property without one -- so any update to a
 * property with a configured reverse side must re-supply this descriptor
 * even when the caller isn't touching the reverse side's own fields.
 */
function toReverseDescriptorFields(
  propertyName: string,
  fields: RelationshipPropertyFields
): RelationshipReverseCreateFields {
  return {
    propertyName,
    many: !!fields.many,
    queryFields: fields.queryFields || [],
    title: fields.title,
    description: fields.description,
  };
}

/** Drops keys whose value is `undefined`, so a partial CLI-flag object only overrides what was actually passed. */
function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * Reads a relationship property, returning `null` (rather than throwing) if
 * it doesn't exist. A 404 from the dedicated v2 API reliably means the
 * property itself doesn't exist -- confirmed by the same pattern already
 * used for `hasIdmFeature` in frodo-lib's IdmFeatureOps. Any other failure
 * propagates rather than being silently treated as "not found".
 */
async function tryReadRelationshipProperty(
  type: string,
  propertyName: string
): Promise<Record<string, unknown> | null> {
  try {
    const property = await readManagedObjectSchemaProperty(type, propertyName);
    return property as unknown as Record<string, unknown>;
  } catch (error) {
    if ((error as FrodoError).httpStatus === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Infers a relationship property's reverse side (type + property name) from
 * its own definition -- the source of truth `--with-reverse` reads from on
 * `update`/`delete`, needing no separate identity flags.
 */
function inferReverseIdentity(
  property: Record<string, unknown>
): { type: string; propertyName: string } | null {
  const rel = (property.type === 'array' ? property.items : property) as Record<
    string,
    unknown
  >;
  const reversePropertyName = rel?.reversePropertyName as string | undefined;
  const resourceCollection = (
    rel?.resourceCollection as Array<Record<string, unknown>>
  )?.[0];
  const path = resourceCollection?.path as string | undefined;
  if (!reversePropertyName || !path?.startsWith('managed/')) {
    return null;
  }
  return {
    type: path.slice('managed/'.length),
    propertyName: reversePropertyName,
  };
}

/**
 * Describe a single relationship schema property of a managed object type,
 * via the dedicated Cloud-only v2 API. `withReverse` also reads and displays
 * the reverse side, inferred from the forward property's own definition.
 * @param {string} type managed object type, e.g. alpha_aiagentprivilege
 * @param {string} propertyName relationship property name, e.g. agent
 * @param {boolean} json true to print raw JSON instead of a table
 * @param {boolean} withReverse true to also read and display the reverse side
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function describeManagedObjectSchemaRelationshipProperty(
  type: string,
  propertyName: string,
  json: boolean = false,
  withReverse: boolean = false
): Promise<boolean> {
  try {
    const property = await tryReadRelationshipProperty(type, propertyName);
    if (!property) {
      printError(
        new FrodoError(
          `Relationship property "${propertyName}" not found on managed type "${type}"`
        )
      );
      return false;
    }
    let reverse:
      | {
          type: string;
          propertyName: string;
          property: Record<string, unknown>;
        }
      | undefined;
    if (withReverse) {
      const identity = inferReverseIdentity(property);
      if (!identity) {
        printError(
          new FrodoError(
            `Relationship property "${propertyName}" on managed type "${type}" has no reverse relationship configured.`
          )
        );
        return false;
      }
      const reverseProperty = await tryReadRelationshipProperty(
        identity.type,
        identity.propertyName
      );
      if (!reverseProperty) {
        printError(
          new FrodoError(
            `Reverse relationship property "${identity.propertyName}" not found on managed type "${identity.type}".`
          )
        );
        return false;
      }
      reverse = { ...identity, property: reverseProperty };
    }
    if (json) {
      printMessage(
        JSON.stringify(
          reverse
            ? {
                [type]: { [propertyName]: property },
                [reverse.type]: { [reverse.propertyName]: reverse.property },
              }
            : property,
          null,
          2
        ),
        'data'
      );
      return true;
    }
    printMessage(`\n${type}.${propertyName}:`, 'data');
    printMessage(createObjectTable(property).toString(), 'data');
    if (reverse) {
      printMessage(
        `\n${reverse.type}.${reverse.propertyName} (reverse):`,
        'data'
      );
      printMessage(createObjectTable(reverse.property).toString(), 'data');
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Create a new relationship schema property, via the dedicated Cloud-only v2
 * API. Refuses if a property with that name already exists (use update
 * instead). When `reverse` is given, the reverse side on
 * `fields.targetObject` is auto-created by the server in the same write --
 * see {@link buildReversePropertyDescriptor} -- rather than through a
 * separate CLI-side write; live-confirmed to work for all four single/many
 * combinations on both sides. Note the server does not honor a custom
 * reverse title/description (it always uses the raw property name for
 * both), even though `--reverse-title`/`--reverse-description` are threaded
 * through in case that changes.
 * @param {string} type managed object type, e.g. alpha_aiagentprivilege
 * @param {string} propertyName relationship property name, e.g. agent
 * @param {RelationshipPropertyFields} fields the forward side's field values
 * @param {RelationshipReverseCreateFields} [reverse] the reverse side's field values, if creating both sides
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function createManagedObjectSchemaRelationshipProperty(
  type: string,
  propertyName: string,
  fields: RelationshipPropertyFields,
  reverse?: RelationshipReverseCreateFields
): Promise<boolean> {
  let indicatorId: string;
  try {
    const existingForward = await tryReadRelationshipProperty(
      type,
      propertyName
    );
    if (existingForward) {
      printError(
        new FrodoError(
          `Relationship property "${propertyName}" already exists on managed type "${type}". Use update instead.`
        )
      );
      return false;
    }
    if (reverse) {
      const existingReverse = await tryReadRelationshipProperty(
        fields.targetObject,
        reverse.propertyName
      );
      if (existingReverse) {
        printError(
          new FrodoError(
            `Relationship property "${reverse.propertyName}" already exists on managed type "${fields.targetObject}". Use update instead.`
          )
        );
        return false;
      }
    }
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      reverse
        ? `Creating relationship property ${propertyName} on ${type}, with reverse side ${reverse.propertyName} on ${fields.targetObject}...`
        : `Creating relationship property ${propertyName} on ${type}...`
    );
    const forwardPayload = buildRelationshipPropertyPayload(
      propertyName,
      {
        ...fields,
        reversePropertyName: reverse
          ? reverse.propertyName
          : fields.reversePropertyName,
      },
      reverse
    );
    await updateManagedObjectSchemaProperty(
      type,
      propertyName,
      forwardPayload as unknown as ManagedObjectSchemaProperty
    );
    stopProgressIndicator(
      indicatorId,
      reverse
        ? `Created relationship property ${propertyName} on ${type}, with reverse side ${reverse.propertyName} auto-created on ${fields.targetObject}`
        : `Created relationship property ${propertyName} on ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error creating relationship property ${propertyName} on ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Update an existing relationship schema property, via the dedicated
 * Cloud-only v2 API. Refuses if the property doesn't exist (use create
 * instead). Only the fields present in `changedFields` change; everything
 * else keeps its current value. `withReverse` infers the reverse side from
 * the forward property's own current definition (no separate identity
 * flags needed) and applies the same explicit overrides to it too; no
 * automatic rollback if the reverse write fails after the forward side
 * already succeeded.
 * @param {string} type managed object type, e.g. alpha_aiagentprivilege
 * @param {string} propertyName relationship property name, e.g. agent
 * @param {Partial<RelationshipPropertyFields>} changedFields only the explicitly-passed field overrides
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @param {boolean} withReverse true to also update the inferred reverse side
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function updateManagedObjectSchemaRelationshipPropertyCli(
  type: string,
  propertyName: string,
  changedFields: Partial<RelationshipPropertyFields>,
  skipConfirmation: boolean = false,
  withReverse: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  try {
    const current = await tryReadRelationshipProperty(type, propertyName);
    if (!current) {
      printError(
        new FrodoError(
          `Relationship property "${propertyName}" not found on managed type "${type}". Use create instead.`
        )
      );
      return false;
    }
    // A configured reverse side's descriptor must be re-supplied on every
    // write, not just when --with-reverse asks to also change its fields --
    // see toReverseDescriptorFields. So the reverse side is fetched whenever
    // one exists, regardless of --with-reverse.
    const reverseIdentity = inferReverseIdentity(current);
    if (withReverse && !reverseIdentity) {
      printError(
        new FrodoError(
          `Relationship property "${propertyName}" on managed type "${type}" has no reverse relationship configured; --with-reverse cannot be used.`
        )
      );
      return false;
    }
    let reverseCurrent: Record<string, unknown> | null = null;
    if (reverseIdentity) {
      reverseCurrent = await tryReadRelationshipProperty(
        reverseIdentity.type,
        reverseIdentity.propertyName
      );
      if (!reverseCurrent) {
        printError(
          new FrodoError(
            `Reverse relationship property "${reverseIdentity.propertyName}" not found on managed type "${reverseIdentity.type}".`
          )
        );
        return false;
      }
    }
    const overrides = pruneUndefined(changedFields);
    const mergedForwardFields = {
      ...extractRelationshipFields(current),
      ...overrides,
    };
    const mergedReverseFields =
      reverseCurrent && reverseIdentity
        ? withReverse
          ? { ...extractRelationshipFields(reverseCurrent), ...overrides }
          : extractRelationshipFields(reverseCurrent)
        : undefined;
    const forwardPayload = buildRelationshipPropertyPayload(
      propertyName,
      mergedForwardFields,
      mergedReverseFields && reverseIdentity
        ? toReverseDescriptorFields(
            reverseIdentity.propertyName,
            mergedReverseFields
          )
        : undefined
    );
    let warning = `\nCurrent (${type}.${propertyName}):\n${JSON.stringify(current, null, 2)}\n\nProposed:\n${JSON.stringify(forwardPayload, null, 2)}`;
    let reversePayload: Record<string, unknown> | undefined;
    if (withReverse && mergedReverseFields && reverseIdentity) {
      reversePayload = buildRelationshipPropertyPayload(
        reverseIdentity.propertyName,
        mergedReverseFields,
        toReverseDescriptorFields(propertyName, mergedForwardFields)
      );
      warning += `\n\nCurrent (${reverseIdentity.type}.${reverseIdentity.propertyName}, reverse):\n${JSON.stringify(reverseCurrent, null, 2)}\n\nProposed:\n${JSON.stringify(reversePayload, null, 2)}`;
    }
    if (
      !(await confirmChange(
        warning,
        `\nUpdate relationship property "${propertyName}" on managed type "${type}"${withReverse ? ' and its reverse side' : ''}? This affects every existing and future record of that type. Continue? (y|n):`,
        skipConfirmation
      ))
    ) {
      printMessage('Update aborted.', 'warn');
      return false;
    }
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Updating relationship property ${propertyName} on ${type}...`
    );
    await updateManagedObjectSchemaProperty(
      type,
      propertyName,
      forwardPayload as unknown as ManagedObjectSchemaProperty
    );
    stopProgressIndicator(
      indicatorId,
      `Updated relationship property ${propertyName} on ${type}`,
      'success'
    );
    if (withReverse && reversePayload && reverseIdentity) {
      indicatorId = createProgressIndicator(
        'indeterminate',
        0,
        `Updating reverse relationship property ${reverseIdentity.propertyName} on ${reverseIdentity.type}...`
      );
      try {
        await updateManagedObjectSchemaProperty(
          reverseIdentity.type,
          reverseIdentity.propertyName,
          reversePayload as unknown as ManagedObjectSchemaProperty
        );
        stopProgressIndicator(
          indicatorId,
          `Updated reverse relationship property ${reverseIdentity.propertyName} on ${reverseIdentity.type}`,
          'success'
        );
      } catch (error) {
        stopProgressIndicator(
          indicatorId,
          `Updated ${type}.${propertyName}, but failed to update its reverse side ${reverseIdentity.type}.${reverseIdentity.propertyName}.`,
          'fail'
        );
        printError(error);
        return false;
      }
    }
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error updating relationship property ${propertyName} on ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Delete a relationship schema property, via the dedicated Cloud-only v2
 * API. `withReverse` infers the reverse side from the forward property's
 * own current definition (no separate identity flags needed) and deletes
 * it first, then the forward side, so a failed second delete leaves the
 * explicitly-named side as the one still consistently present.
 * @param {string} type managed object type, e.g. alpha_aiagentprivilege
 * @param {string} propertyName relationship property name, e.g. agent
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @param {boolean} withReverse true to also delete the inferred reverse side
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function deleteManagedObjectSchemaRelationshipPropertyCli(
  type: string,
  propertyName: string,
  skipConfirmation: boolean = false,
  withReverse: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  try {
    const current = await tryReadRelationshipProperty(type, propertyName);
    if (!current) {
      printError(
        new FrodoError(
          `Relationship property "${propertyName}" not found on managed type "${type}"`
        )
      );
      return false;
    }
    let reverseIdentity: { type: string; propertyName: string } | null = null;
    let reverseCurrent: Record<string, unknown> | null = null;
    if (withReverse) {
      reverseIdentity = inferReverseIdentity(current);
      if (!reverseIdentity) {
        printError(
          new FrodoError(
            `Relationship property "${propertyName}" on managed type "${type}" has no reverse relationship configured; --with-reverse cannot be used.`
          )
        );
        return false;
      }
      reverseCurrent = await tryReadRelationshipProperty(
        reverseIdentity.type,
        reverseIdentity.propertyName
      );
      if (!reverseCurrent) {
        printError(
          new FrodoError(
            `Reverse relationship property "${reverseIdentity.propertyName}" not found on managed type "${reverseIdentity.type}".`
          )
        );
        return false;
      }
    }
    let warning = `\nThis will permanently remove the following relationship property definition from managed type "${type}":\n${JSON.stringify(current, null, 2)}`;
    if (withReverse && reverseCurrent && reverseIdentity) {
      warning += `\n\n...and its reverse side, from managed type "${reverseIdentity.type}":\n${JSON.stringify(reverseCurrent, null, 2)}`;
    }
    warning += `\n\nThis removes the property from the schema only — it does not purge any values already stored for it on existing records.`;
    if (
      !(await confirmChange(
        warning,
        `\nDelete relationship property "${propertyName}" from managed type "${type}"${withReverse ? ' and its reverse side' : ''}? This affects every existing and future record of that type. Continue? (y|n):`,
        skipConfirmation
      ))
    ) {
      printMessage('Delete aborted.', 'warn');
      return false;
    }
    if (withReverse && reverseIdentity) {
      indicatorId = createProgressIndicator(
        'indeterminate',
        0,
        `Deleting reverse relationship property ${reverseIdentity.propertyName} from ${reverseIdentity.type}...`
      );
      try {
        await removeManagedObjectSchemaProperty(
          reverseIdentity.type,
          reverseIdentity.propertyName
        );
        stopProgressIndicator(
          indicatorId,
          `Deleted reverse relationship property ${reverseIdentity.propertyName} from ${reverseIdentity.type}`,
          'success'
        );
      } catch (error) {
        stopProgressIndicator(
          indicatorId,
          `Error deleting reverse relationship property ${reverseIdentity.propertyName} from ${reverseIdentity.type}. Forward side "${type}.${propertyName}" was left untouched.`,
          'fail'
        );
        printError(error);
        return false;
      }
    }
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Deleting relationship property ${propertyName} from ${type}...`
    );
    try {
      await removeManagedObjectSchemaProperty(type, propertyName);
    } catch (error) {
      // Deleting a relationship property auto-created via the bidirectional
      // create mechanism (see buildReversePropertyDescriptor) cascades:
      // removing the reverse side already removed this forward side too --
      // live-confirmed. A 404 here right after a --with-reverse deletion
      // means the end state we wanted (both sides gone) was already
      // reached, not a failure.
      if (!(withReverse && (error as FrodoError).httpStatus === 404)) {
        throw error;
      }
    }
    stopProgressIndicator(
      indicatorId,
      `Deleted relationship property ${propertyName} from ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error deleting relationship property ${propertyName} from ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Create a new managed object type from a file. The type name comes from
 * the file's own `name` field. Refuses if a type with that name already
 * exists (use update instead). Prompts for confirmation, reusing the same
 * schema-change gate `frodo idm schema object import` already uses, unless
 * skipConfirmation is set.
 * @param {string} file file containing the full type definition (schema included), including its `name`
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function createManagedObjectType(
  file: string,
  skipConfirmation: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  let type: string;
  try {
    const typeConfig = readJsonFile(file) as ManagedObjectTypeConfig;
    type = typeConfig.name;
    if (
      !(await confirmChange(
        `\nThis creates the SCHEMA of a new managed-object type "${type}", not just its configuration.`,
        '\nSchema changes affect every existing and future record of that managed-object type. Continue? (y|n):',
        skipConfirmation
      ))
    ) {
      printMessage('Create aborted.', 'warn');
      return false;
    }
    if (await managedObjectTypeExists(type)) {
      printError(
        new FrodoError(
          `Managed type "${type}" already exists. Use update instead.`
        )
      );
      return false;
    }
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Creating managed object type ${type}...`
    );
    await importSubConfigEntity('managed', typeConfig, { validate: false });
    stopProgressIndicator(
      indicatorId,
      `Created managed object type ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error creating managed object type ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Update an existing managed object type from a file. The type name comes
 * from the file's own `name` field. Refuses if the type doesn't exist (use
 * create instead). Prompts for confirmation, reusing the same schema-change
 * gate `frodo idm schema object import` already uses, unless
 * skipConfirmation is set.
 * @param {string} file file containing the updated type definition, including its `name`
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function updateManagedObjectTypeCli(
  file: string,
  skipConfirmation: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  let type: string;
  try {
    const typeConfig = readJsonFile(file) as ManagedObjectTypeConfig;
    type = typeConfig.name;
    const names = getSchemaBearingObjectNames([typeConfig]);
    if (
      names.length > 0 &&
      !(await confirmChange(
        `\nThis import defines the SCHEMA of managed-object type "${type}", not just its configuration.`,
        '\nSchema changes affect every existing and future record of that managed-object type. Continue? (y|n):',
        skipConfirmation
      ))
    ) {
      printMessage('Update aborted.', 'warn');
      return false;
    }
    if (!(await managedObjectTypeExists(type))) {
      printError(
        new FrodoError(`Managed type "${type}" not found. Use create instead.`)
      );
      return false;
    }
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Updating managed object type ${type}...`
    );
    await importSubConfigEntity('managed', typeConfig, { validate: false });
    stopProgressIndicator(
      indicatorId,
      `Updated managed object type ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error updating managed object type ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Counts the records of a managed object type. A 404 from the query
 * endpoint reliably means the type's collection was never provisioned —
 * i.e. confirmed zero records, not an unknown failure — so it resolves to
 * 0 rather than propagating. Any other failure (permission, timeout, etc.)
 * propagates, since that genuinely is an unknown count and must not be
 * silently treated as "safe to proceed" (the exact not-found-misclassification
 * anti-pattern the tracker flagged elsewhere).
 * @param {string} type managed object type
 * @return {Promise<number>} a promise that resolves to the record count
 */
async function countManagedObjectRecords(type: string): Promise<number> {
  try {
    return await countManagedObjectsOfType(type);
  } catch (error) {
    if ((error as FrodoError).httpStatus === 404) {
      return 0;
    }
    throw error;
  }
}

/**
 * Delete a managed object type entirely (schema included). Refuses if the
 * type has existing records, or if the record count couldn't be confirmed,
 * unless force is set — every existing record of that type becomes
 * orphaned by this operation, so an -F/--force override is required in
 * addition to skipConfirmation (matching `frodo iga workflow delete -F`'s
 * existing pattern in this codebase: a distinct override for a safety
 * check, not a bigger confirmation prompt). Otherwise prompts for
 * confirmation unless skipConfirmation is set.
 * @param {string} type managed object type to delete, e.g. alpha_customType
 * @param {boolean} skipConfirmation true to skip the confirmation prompt
 * @param {boolean} force true to proceed even if records exist or the record count is unknown
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function deleteManagedObjectTypeCli(
  type: string,
  skipConfirmation: boolean = false,
  force: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  try {
    let recordCount: number | undefined;
    try {
      recordCount = await countManagedObjectRecords(type);
    } catch {
      // count stays undefined; handled as "unknown" below
    }
    if (recordCount === undefined && !force) {
      printError(
        new FrodoError(
          `Could not confirm whether managed type "${type}" has existing records. Pass -F/--force to delete anyway.`
        )
      );
      return false;
    }
    if (recordCount !== undefined && recordCount > 0 && !force) {
      printError(
        new FrodoError(
          `Refusing: managed type "${type}" has ${recordCount} existing record(s). Pass -F/--force to delete anyway.`
        )
      );
      return false;
    }
    const recordCountMessage =
      recordCount === undefined
        ? ' (record count could not be confirmed)'
        : `, which has ${recordCount} existing record(s)`;
    if (
      !(await confirmChange(
        `\nThis will permanently delete the SCHEMA of managed-object type "${type}"${recordCountMessage}. Every existing record of this type becomes orphaned.`,
        `\nDelete managed-object type "${type}"? This cannot be undone through Frodo. Continue? (y|n):`,
        skipConfirmation
      ))
    ) {
      printMessage('Delete aborted.', 'warn');
      return false;
    }
    // No separate existence pre-check: removeSubConfigEntity does its own
    // single read of the whole 'managed' config entity and throws its own
    // not-found error if the type is missing, so a second read here would
    // be a redundant round-trip.
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Deleting managed object type ${type}...`
    );
    await removeSubConfigEntity('managed', type, { validate: false });
    stopProgressIndicator(
      indicatorId,
      `Deleted managed object type ${type}`,
      'success'
    );
    return true;
  } catch (error) {
    if (indicatorId) {
      stopProgressIndicator(
        indicatorId,
        `Error deleting managed object type ${type}.`,
        'fail'
      );
    }
    printError(error);
  }
  return false;
}

/**
 * Import all IDM configuration objects from working directory
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @param {boolean} validate True to validate script hooks. Default: false
 * @return {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function importAllConfigEntitiesFromFiles(
  entitiesFile?: string,
  validate: boolean = false
): Promise<boolean> {
  let indicatorId: string;
  const baseDirectory = getWorkingDirectory();
  try {
    const importData = await getIdmImportDataFromIdmDirectory(baseDirectory);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing config entities from ${baseDirectory}...`
    );
    const options = getIdmImportExportOptions(entitiesFile);
    await importConfigEntities(
      importData as ConfigEntityExportInterface,
      undefined,
      {
        entitiesToImport: options.entitiesToExportOrImport,
        validate,
      },
      errorHandler
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
    const result = await countManagedObjectsOfType(type);
    printMessage(`${type}: ${result}`, 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Helper that reads all the idm config entity data from a directory
 * @param directory The directory of the idm config entities
 */
export async function getIdmImportDataFromIdmDirectory(
  directory: string
): Promise<ConfigEntityExportInterface> {
  const importData = { idm: {} } as ConfigEntityExportInterface;
  const idmConfigFiles = await readFiles(directory);
  idmConfigFiles.forEach((f) => (f.path = f.path.replace(/\/$/, '')));
  // Process sync mapping file(s)
  const sync = getLegacyMappingsFromFiles(idmConfigFiles);
  if (sync.mappings && sync.mappings.length > 0) {
    importData.idm.sync = sync;
  }
  const managed = getManagedObjectsFromFiles(idmConfigFiles);
  if (managed.objects && managed.objects.length > 0) {
    importData.idm.managed = managed;
  }
  // Process other files
  for (const f of idmConfigFiles.filter(
    (f) =>
      !f.path.endsWith('sync.idm.json') &&
      !f.path.endsWith('managed.idm.json') &&
      f.path.endsWith('.idm.json')
  )) {
    const baseDirOfThisJson = path.dirname(f.path);
    const entities = Object.values(
      JSON.parse(f.content).idm
    ) as unknown as IdObjectSkeletonInterface[];
    for (const entity of entities) {
      resolveAllExtractedScriptsForImport(entity, baseDirOfThisJson);
      importData.idm[entity._id] = entity;
    }
  }
  return importData;
}

/**
 * Recursive helper that reads in extracted scripts from IDM exports
 * @param {any} obj The object to read scripts in for
 * @param {string} baseDir The base directory where the extracted files are stored relative to
 * @param {WeakSet} visited The visited objects
 */
export function resolveAllExtractedScriptsForImport(
  obj: any,
  baseDir: string,
  visited = new WeakSet()
) {
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  if (visited.has(obj)) return;
  visited.add(obj);
  if (Array.isArray(obj)) {
    for (const item of obj) {
      resolveAllExtractedScriptsForImport(item, baseDir, visited);
    }
    return;
  }
  if (typeof obj.source === 'string' && obj.source.startsWith('file://')) {
    const fileContent = getExtractedData(obj.source, baseDir);
    if (fileContent !== null) {
      obj.source = fileContent;
    }
  }
  for (const key of Object.keys(obj)) {
    resolveAllExtractedScriptsForImport(obj[key], baseDir, visited);
  }
}

/**
 * Helper that returns options for exporting/importing IDM config entities
 * @param {string} entitiesFile JSON file that specifies the config entities to export/import
 * @return {ConfigEntityExportOptions} the config export options
 */
export function getIdmImportExportOptions(entitiesFile?: string): {
  entitiesToExportOrImport: string[];
} {
  // read list of entities to export/import
  let entitiesToExportOrImport: string[] = [];
  if (entitiesFile) {
    const data = fs.readFileSync(entitiesFile, 'utf8');
    const entriesData = JSON.parse(data);
    entitiesToExportOrImport = entriesData.idm;
  }
  return {
    entitiesToExportOrImport,
  };
}

/**
 * Helper that writes objects in the managed IDM config entity to a directory
 * @param {ManagedSkeleton} managed The managed IDM config entity
 * @param {string} directory The directory to save the entity to within the base directory
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract true to extract idm scripts, false otherwise. Default: false
 */
export function writeManagedJsonToDirectory(
  managed: ManagedSkeleton,
  directory: string = 'managed',
  includeMeta: boolean = true,
  extract: boolean = false
) {
  const objectPaths = [];
  for (const object of managed.objects) {
    if (!object) {
      // Skip null/malformed entries in the tenant's managed.json objects array.
      continue;
    }
    const fileName = getTypedFilename(object.name, 'managed');
    if (
      extract &&
      extractManagedObjectScriptsToDirectory(
        object,
        `${directory}/${object.name}`
      )
    ) {
      objectPaths.push(
        extractDataToFile(object, `${object.name}/${fileName}`, directory)
      );
    } else {
      objectPaths.push(extractDataToFile(object, fileName, directory));
    }
  }
  managed.objects = objectPaths;
  saveToFile(
    'idm',
    managed,
    '_id',
    getFilePath(`${directory}/managed.idm.json`, true),
    includeMeta
  );
}

/**
 * Helper that extracts scripts from a managed object
 * @param {ObjectSkeleton} object The managed object
 * @param {string} directory The directory to extract scripts to within the base directory
 * @returns {boolean} true if at least one script got extracted, false otherwise
 */
export function extractManagedObjectScriptsToDirectory(
  object: ObjectSkeleton,
  directory: string = object.name
): boolean {
  const scripts = findIdmScripts(object);
  if (!scripts.length) return false;
  for (const script of scripts) {
    const managedObjectPath = script.path
      .replace('schema.', '')
      .replaceAll('properties.', '');
    const sourceObj = getObjectByPath(object, script.path);
    const objectFileName = `${managedObjectPath}.${script.type}`;
    sourceObj.source = extractDataToFile(
      script.source,
      objectFileName,
      directory
    );
  }
  return true;
}

/**
 * Helper that writes an IDM config entity to a directory
 * @param {IdObjectSkeletonInterface} object The IDM config entity
 * @param {string} directory The directory to save the entity to within the base directory
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract true to extract idm scripts, false otherwise. Default: false
 */
export function writeIdmObjectToDirectory(
  object: IdObjectSkeletonInterface,
  directory: string = '.',
  includeMeta: boolean = true,
  extract: boolean = false
) {
  let filePath;
  if (extract && extractIdmScriptsToDirectory(object, directory)) {
    filePath = getFilePath(
      `${directory}/${object._id}/${getTypedFilename(object._id.split('/').pop(), 'idm')}`,
      true
    );
  } else {
    filePath = getFilePath(`${directory}/${object._id}.idm.json`, true);
  }
  const directoryPath = path.dirname(filePath);
  if (!fs.existsSync(directoryPath))
    fs.mkdirSync(directoryPath, { recursive: true });
  saveToFile('idm', object, '_id', filePath, includeMeta);
}

/**
 * Helper that extracts scripts from an IDM entity
 * @param {ObjectSkeleton} object The IDM entity
 * @param {string} directory The directory to extract scripts to within the base directory
 * @returns {boolean} true if at least one script got extracted, false otherwise
 */
export function extractIdmScriptsToDirectory(
  object: IdObjectSkeletonInterface,
  directory: string
): boolean {
  const scripts = findIdmScripts(object);
  if (!scripts.length) return false;
  for (const script of scripts) {
    let objectFileName;
    let sourceObject;
    if (!script.path) {
      objectFileName = `${object._id.split('/').pop()}.${script.type}`;
      sourceObject = object;
    } else {
      objectFileName = `${script.path}.${script.type}`;
      sourceObject = getObjectByPath(object, script.path);
    }
    sourceObject.source = extractDataToFile(
      script.source,
      objectFileName,
      `${directory}/${object._id}`
    );
  }
  return true;
}

/**
 * Helper that reads the managed IDM config entity from files
 * @param {{ path: string; content: string }[]} files the files to read the managed IDM config entity object from
 * @returns {ManagedSkeleton} the managed IDM config entity
 */
export function getManagedObjectsFromFiles(
  files: { path: string; content: string }[]
): ManagedSkeleton {
  const managedFiles = files.filter((f) =>
    f.path.endsWith('/managed.idm.json')
  );
  if (managedFiles.length > 1) {
    throw new FrodoError(
      'Multiple managed.idm.json files found in idm directory'
    );
  }
  const managed: ManagedSkeleton = {
    _id: 'managed',
    objects: [],
  };
  if (managedFiles.length === 1) {
    const jsonData = JSON.parse(managedFiles[0].content);
    const managedData = jsonData.managed ?? jsonData.idm?.managed;
    const managedJsonDir = managedFiles[0].path.substring(
      0,
      managedFiles[0].path.indexOf('/managed.idm.json')
    );
    if (managedData?.objects) {
      for (const object of managedData.objects) {
        let resolvedObject: any;
        if (typeof object === 'string') {
          resolvedObject = getExtractedJsonData(object, managedJsonDir);
        } else {
          resolvedObject = object;
        }
        resolveAllExtractedScriptsForImport(
          resolvedObject,
          `${managedJsonDir}/${resolvedObject.name}`
        );
        managed.objects.push(resolvedObject);
      }
    }
  }
  return managed;
}

/**
 * Helper that returns the first object name in a path
 * @param {string} path The object path
 * @returns {string} The first name in the path
 */
export function getTopString(path: string): string {
  return path.split('.')[0];
}

/**
 * Helper that returns the first object in a path
 * @param {string} path The object path
 * @param {any} obj The parent object
 * @returns {any} The first object in the path
 */
export function getTopObject(path: string, obj: any): any {
  return obj[getTopString(path)];
}

/**
 * Helper that returns the last object name in a path
 * @param {string} path The object path
 * @returns {string} The last name in the path
 */
export function getLastString(path: string) {
  const parts = path.split('.');
  return parts[parts.length - 1];
}

/**
 * Helper that returns the object at the specified path
 * @param {string} path The object path
 * @param {any} obj The parent object
 * @returns {any} The object at the path
 */
export function getObjectByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => {
    const realKey = /^\d+$/.test(key) ? Number(key) : key;
    return acc?.[realKey];
  }, obj);
}

/**
 * Helper that returns the object at the second to last of the specified path
 * @param {string} path The object path
 * @param {any} obj The parent object
 * @returns {any} The object at the second to last of the path
 */
export function getObjectByPathExcludeLast(obj: any, path: string): any {
  const keys = path.split('.');
  keys.pop();
  return getObjectByPath(obj, keys.join('.'));
}

/**
 * Recursive helper that finds all IDM scripts within an object
 * @param {any} obj The object
 * @param {string} currentPath The current path to the object
 * @param {MatchResult[]} result the found IDM scripts so far
 * @returns {MatchResult[]} the found IDM scripts
 */
export function findIdmScripts(
  obj: any,
  currentPath: string = '',
  result: MatchResult[] = []
): MatchResult[] {
  if (typeof obj !== 'object' || obj === null) return result;
  if ('source' in obj && 'type' in obj) {
    const normalizedSource = Array.isArray(obj.source)
      ? obj.source.join('\n')
      : obj.source;
    const scriptType =
      obj.type === 'text/javascript'
        ? 'js'
        : obj.type === 'groovy'
          ? 'groovy'
          : 'unknown';
    result.push({
      path: currentPath,
      source: normalizedSource,
      type: scriptType,
    });
  }

  for (const key of Object.keys(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    findIdmScripts(obj[key], newPath, result);
  }

  return result;
}
