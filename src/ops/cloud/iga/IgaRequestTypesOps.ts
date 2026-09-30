import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import {
  RequestTypeSchema,
  RequestTypeSchemas,
} from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaRequestTypeApi';
import {
  RequestTypeExportInterface,
  RequestTypeExportOptions,
  RequestTypeImportOptions,
} from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaRequestTypeOps';
import fs from 'fs';

import { extractDataToFile } from '../../../utils/Config';
import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../../../utils/Console';

const {
  getTypedFilename,
  saveToFile,
  saveJsonToFile,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const {
  readRequestTypes,
  exportRequestType,
  exportRequestTypes,
  exportRequestTypeByName,
  importRequestTypes,
  deleteRequestTypeByName,
  deleteRequestTypes,
} = frodo.cloud.iga.requestType;

/**
 * List all the request types
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listRequestTypes(
  long: boolean = false
): Promise<boolean> {
  try {
    const requestTypes = await readRequestTypes();
    if (!long) {
      for (const requestType of requestTypes) {
        printMessage(`${requestType.displayName}`, 'data');
      }
      return true;
    }
    const table = createTable(['ID', 'Name', 'Type', 'Description']);
    for (const requestType of requestTypes) {
      table.push([
        `${requestType.id}`,
        requestType.displayName,
        requestType.workflow.type,
        requestType.description ?? '',
      ]);
    }
    printMessage(table.toString(), 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Describe a request form
 * @param {string} typeName the request form name
 * @param {string} file optional file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeRequestType(
  typeName?: string,
  file?: string
): Promise<boolean> {
  try {
    const requestTypeExport: RequestTypeExportInterface = file
      ? (JSON.parse(
          fs.readFileSync(getFilePath(file), 'utf8')
        ) as RequestTypeExportInterface)
      : await exportRequestTypeByName(typeName);

    let type;
    if (typeName) {
      type = Object.values(requestTypeExport.requestType).find(
        (t) => t.displayName === typeName
      );
      if (!type) {
        throw new FrodoError(
          `Request type '${typeName}' not found in export${file ? ` file ${file}` : ''}`
        );
      }
    } else {
      const types = Object.values(requestTypeExport.requestType);
      if (types.length === 0) {
        throw new FrodoError(`No request types found in export file ${file}`);
      }
      type = types[0];
    }

    // Form Details
    printMessage('Request Form', 'data');
    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], type.id]);
    table.push(['Name'['brightCyan'], type.displayName]);
    table.push(['Type'['brightCyan'], type.workflow.type]);
    table.push(['Description'['brightCyan'], type.description ?? '']);
    table.push(['Operation'['brightCyan'], type.categories?.operation ?? '']);
    if (type.categories?.applicationType) {
      table.push([
        'Application Type'['brightCyan'],
        type.categories.applicationType,
      ]);
    }
    if (type.categories?.objectType) {
      table.push(['Object Type'['brightCyan'], type.categories.objectType]);
    }
    if (type.categories?.lcmType) {
      table.push(['LCM Type'['brightCyan'], type.categories.lcmType]);
    }
    if (type.categories?.requestType) {
      table.push(['Request Type'['brightCyan'], type.categories.requestType]);
    }
    if (type._rev !== undefined) {
      table.push(['Revision'['brightCyan'], `${type._rev}`]);
    }
    if (type.metadata?.createdDate) {
      table.push(['Created'['brightCyan'], type.metadata.createdDate]);
    }
    if (type.metadata?.modifiedDate) {
      table.push(['Modified'['brightCyan'], type.metadata.modifiedDate]);
    }
    printMessage(table.toString() + '\n', 'data');

    // type Structure (sections and input fields)
    printMessage(`Request Type: ${type.displayName} [${type.id}]`, 'data');
    if (type.description) printMessage(`  ${type.description}`, 'data');
    printMessage(`  Custom: ${type.custom ?? false}`, 'data');
    if (type.workflow?.id) {
      printMessage(
        `  requestType: ${type.workflow.id} (${type.workflow.type ?? 'n/a'})`,
        'data'
      );
    }

    const schemaGroups: (keyof RequestTypeSchemas)[] = [
      'common',
      'entitlement',
      'user',
      'entity',
      'custom',
    ];

    for (const group of schemaGroups) {
      const entries = type.schemas?.[group] ?? [];
      if (!entries.length) continue;
      printMessage(`  ${group} schemas (${entries.length}):`, 'data');
      for (const entry of entries) {
        if (typeof entry === 'string') {
          printMessage(`    - ${entry}`, 'data');
          continue;
        }
        const schema = entry as RequestTypeSchema;
        const name =
          schema._meta.displayName ?? schema._meta.display ?? schema._meta.type;
        const props = schema._meta.properties ?? {};
        printMessage(
          `    - [${schema._meta.type}] ${name} (${Object.keys(props).length} prop(s))`,
          'data'
        );
        for (const [propName, prop] of Object.entries(props)) {
          const required = prop.isRequired ? ' *'['brightRed'] : '';
          const label = prop.display?.name ?? propName;
          printMessage(`        - ${label}${required}`, 'data');
        }
      }
    }

    if (type.validation?.source)
      printMessage(`  Has validation script`, 'data');
    if (type.customValidation?.source)
      printMessage(`  Has custom validation script`, 'data');

    // Assignments
    if (type.assignments && type.assignments.length) {
      printMessage(`Assignments (${type.assignments.length}):`, 'data');
      for (const assignment of type.assignments) {
        printMessage(`- ${assignment.objectId}`, 'data');
      }
      printMessage('', 'data');
    }

    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
/**
 * Export request type to file by ID
 * @param {string} typeId request type id
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract true to extract scripts to separate files. Default: false
 * @param {RequestFormExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportRequestTypeToFile(
  typeId: string,
  typeName: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: RequestTypeExportOptions = {
    onlyCustom: false,
    useStringArrays: false,
  }
): Promise<boolean> {
  const label = typeName ?? typeId;
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${label}...`
  );
  try {
    const exportData = typeName
      ? await exportRequestTypeByName(typeName, options)
      : await exportRequestType(typeId, options);
    const actualId = Object.keys(exportData.requestType)[0];
    if (!file) {
      const name = exportData.requestType[actualId]?.displayName ?? actualId;
      file = getTypedFilename(name, 'requestForm');
    }
    if (extract) {
      extractRequestTypeScriptsToFiles(exportData, actualId);
    }
    saveJsonToFile(
      exportData,
      getFilePath(file, true),
      includeMeta,
      false,
      keepModifiedProperties
    );
    stopProgressIndicator(
      indicatorId,
      `Exported request type ${typeName} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting request type ${typeName} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}
/**
 * Export all request types to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {RequestTypeExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportAllRequestTypeToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: RequestTypeExportOptions = {
    onlyCustom: false,
    useStringArrays: false,
  }
): Promise<boolean> {
  try {
    const exportData = await exportRequestTypes(options);
    if (!file) {
      file = getTypedFilename('allRequestTypes', 'requestType');
    }
    if (extract) {
      extractRequestTypeScriptsToFiles(exportData);
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
    printError(error, `Error exporting request types to file`);
  }
  return false;
}
/**
 * Export all request types to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {RequestTypeExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
//  */
export async function exportAllRequestTypesToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: RequestTypeExportOptions = {
    onlyCustom: false,
    useStringArrays: false,
  }
): Promise<boolean> {
  try {
    const exportData = await exportRequestTypes(options);
    for (const [typeName, requestType] of Object.entries(
      exportData.requestType
    )) {
      if (extract) {
        extractRequestTypeScriptsToFiles(exportData, typeName);
      }
      saveToFile(
        'requestType',
        requestType,
        'id',
        getFilePath(
          getTypedFilename(requestType.displayName ?? typeName, 'requestType'),
          true
        ),
        includeMeta,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting request types to files`);
  }
  return false;
}
/**
 * Import a request type from file
 * @param {string} typeName request type name
 * @param {string} file import file name
 * @param {RequestTypeImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importRequestTypeFromFile(
  typeName: string,
  file: string,
  options: RequestTypeImportOptions = {
    onlyCustom: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing request types...'
    );
    const requestTypePath = getFilePath(file);
    const readRequestType = fs.readFileSync(requestTypePath, 'utf8');
    const importData: RequestTypeExportInterface = JSON.parse(readRequestType);

    updateProgressIndicator(indicatorId, 'Importing request types...');
    await importRequestTypes(importData, undefined, typeName, options);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported request types ${typeName}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing request type ${typeName}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import request types from file
 * @param {String} file file name
 * @param {RequestTypeExportInterface} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importRequestTypesFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing request types...'
    );
    const readRequestTypes = fs.readFileSync(file, 'utf8');
    const importData: RequestTypeExportInterface = JSON.parse(readRequestTypes);
    updateProgressIndicator(indicatorId, 'Importing request types...');
    await importRequestTypes(importData);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported request types.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing request types.`,
      'fail'
    );
    printError(error, `Error importing request types from file`);
  }
  return false;
}

/**
 * Import all request types from separate files
 * @param {RequestTypeExportInterface} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importRequestTypesFromFiles(): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const requestTypesFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.requestType.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      requestTypesFiles.length,
      'Importing request types...'
    );
    for (const file of requestTypesFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing request type from file ${file}...`
        );
        const readFile = fs.readFileSync(file, 'utf8');
        const importData: RequestTypeExportInterface = JSON.parse(readFile);
        await importRequestTypes(importData, undefined);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing request type from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`One or more errors importing request type`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported request type.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error(s) importing request type.`,
      'fail'
    );
    printError(error, `Error importing request type from files`);
  }
  return false;
}

/**
 * Import first request type from file
 * @param {string} file import file name
 * @param {RequestTypeImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstRequestTypeFromFile(
  file: string,
  options: RequestTypeImportOptions = {
    onlyCustom: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing request types...'
    );
    const readRequestType = fs.readFileSync(getFilePath(file), 'utf8');
    const importData: RequestTypeExportInterface = JSON.parse(readRequestType);
    const TypeId = Object.keys(importData.requestType);
    if (TypeId.length === 0)
      throw new FrodoError(`No request type found in import data`);
    await importRequestTypes(importData, TypeId[0], undefined, options);
    stopProgressIndicator(
      indicatorId,
      `Imported request type from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing request type from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete request type.
 * @param {string} typeName request type name

 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteRequestType(typeName: string): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting request type ${typeName}...`
  );
  try {
    await deleteRequestTypeByName(typeName);

    stopProgressIndicator(
      spinnerId,
      `Deleted request type ${typeName}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Delete request types.
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteAllRequestTypes(): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting request types...`
  );
  try {
    await deleteRequestTypes();
    stopProgressIndicator(spinnerId, `Deleted request types.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Extracts scripts from a request type export into separate files.
 * @param {RequestTypeExportInterface} exportData The request form export
 * @param {string} typeName The request form id to extract scripts from. If undefined, will extract scripts from all request types.
 * @param {string} directory The directory within the base directory to save the script files
 * @returns {boolean} true if successful, false otherwise
 */
export function extractRequestTypeScriptsToFiles(
  exportData: RequestTypeExportInterface,
  typeName?: string,
  directory?: string
): boolean {
  try {
    const types = typeName
      ? [exportData.requestType[typeName]]
      : Object.values(exportData.requestType);
    for (const type of types) {
      if (!type) continue;
      const typeDirectory = `${directory ? directory + '/' : ''}${type.displayName}`;
      // validation script
      const validation = type.validation;
      if (validation?.source) {
        const sourceText = Array.isArray(validation.source)
          ? validation.source.join('\n')
          : validation.source;
        const sourceFileName = getTypedFilename(
          'validation',
          'requestType',
          'js'
        );
        validation.source = extractDataToFile(
          sourceText,
          `${typeDirectory}/${sourceFileName}`
        );
      }
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
