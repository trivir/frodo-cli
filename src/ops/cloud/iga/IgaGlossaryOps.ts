import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import {
  GlossaryObjectType,
  GlossarySchemaItemSkeleton,
} from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaGlossaryApi';
import {
  GlossarySchemaExportInterface,
  GlossarySchemaExportOptions,
  GlossarySchemaImportOptions,
} from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaGlossaryOps';
import fs from 'fs';

import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
  debugMessage,
  getTableRowsFromArray,
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
  readGlossarySchemas,
  exportGlossarySchemas,
  exportGlossarySchemaByName,
  exportGlossarySchema,
  importGlossarySchemas,
  deleteGlossarySchema: _deleteGlossary,
  deleteGlossarySchemaByName: _deleteGlossaryByName,
  deleteGlossarySchemas: _deleteGlossarys,
} = frodo.cloud.iga.glossary;

/**
 * List all the glossaries
 * @param {boolean} long Long version, all the fields
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listGlossary(
  long: boolean = false,
  objectType?: GlossaryObjectType
): Promise<boolean> {
  try {
    const glossaries = await readGlossarySchemas(objectType);
    glossaries.sort((a, b) => a.displayName.localeCompare(b.displayName));
    if (!long) {
      for (const glossary of glossaries) {
        printMessage(glossary.displayName, 'data');
      }
      return true;
    }
    const table = createTable([
      'ID',
      'Name',
      'Display Name',
      'Object Type',
      'Type',
      'Internal',
    ]);
    for (const glossaryItem of glossaries) {
      table.push([
        glossaryItem.id,
        glossaryItem.name,
        glossaryItem.displayName,
        glossaryItem.objectType,
        glossaryItem.type,
        glossaryItem.isInternal ? 'true'['brightGreen'] : 'false'['brightRed'],
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
 * Describe a glossary
 * @param {string} glossaryId glossary id
 * @param {string} glossaryName glossary name
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @param {string} file the glossary export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeGlossary(
  glossaryId?: string,
  glossaryName?: string,
  objectType?: GlossaryObjectType,
  file?: string
): Promise<boolean> {
  try {
    let schemaData;

    if (file) {
      schemaData = getGlossarySchemaExportFromFile(getFilePath(file));
      if (!glossaryId && !glossaryName) {
        const ids = Object.keys(schemaData.glossarySchema);

        if (ids.length === 0) {
          throw new FrodoError(
            `No glossary schemas found in export file ${file}`
          );
        }

        glossaryId = ids[0];
      }

      if (glossaryName && !glossaryId) {
        const glossaryEntries = Object.entries(schemaData.glossarySchema) as [
          string,
          GlossarySchemaItemSkeleton<any>,
        ][];

        const foundEntry = glossaryEntries.find(
          ([, glossary]) =>
            glossary.name === glossaryName &&
            (!objectType || glossary.objectType === objectType)
        );

        if (!foundEntry) {
          throw new FrodoError(
            `Glossary schema named "${glossaryName}" not found in file ${file}`
          );
        }

        glossaryId = foundEntry[0];
      }
    } else {
      if (glossaryId) {
        schemaData = await exportGlossarySchema(glossaryId);
      } else if (glossaryName) {
        schemaData = await exportGlossarySchemaByName(glossaryName, objectType);
      } else {
        throw new FrodoError(
          'Either glossary id, glossary name, or file must be provided.'
        );
      }

      const ids = Object.keys(schemaData.glossarySchema);

      if (ids.length === 0) {
        throw new FrodoError('No glossary schemas returned.');
      }

      glossaryId = ids[0];
    }

    const glossary = schemaData.glossarySchema[glossaryId];
    if (!glossary) {
      throw new FrodoError(`Glossary schema ${glossaryId} not found.`);
    }

    printMessage('Glossary Schema', 'data');

    const table = createKeyValueTable();

    table.push(['Id'['brightCyan'], glossary.id]);

    table.push(['Name'['brightCyan'], glossary.name]);

    table.push(['Display Name'['brightCyan'], glossary.displayName]);

    table.push(['Description'['brightCyan'], glossary.description]);

    table.push(['Type'['brightCyan'], glossary.type]);

    table.push(['Object Type'['brightCyan'], glossary.objectType]);

    if (glossary.managedObjectType) {
      table.push([
        'Managed Object Type'['brightCyan'],
        glossary.managedObjectType,
      ]);
    }

    table.push([
      'Multi Value'['brightCyan'],
      glossary.isMultiValue ? 'true'['brightGreen'] : 'false'['brightRed'],
    ]);

    table.push([
      'Searchable'['brightCyan'],
      glossary.searchable ? 'true'['brightGreen'] : 'false'['brightRed'],
    ]);

    if (glossary.isInternal) {
      table.push([
        'Internal'['brightCyan'],
        glossary.isInternal ? 'true'['brightGreen'] : 'false'['brightRed'],
      ]);
    }

    if (glossary.allowedValues?.length) {
      getTableRowsFromArray(
        table,
        `Allowed Values (${glossary.allowedValues.length})`,
        glossary.allowedValues.map((v) => String(v))
      );
    }

    if (glossary.enumeratedValues?.length) {
      getTableRowsFromArray(
        table,
        `Enumerated Values (${glossary.enumeratedValues.length})`,
        glossary.enumeratedValues.map((v) => `${v.text} => ${v.value}`)
      );
    }

    printMessage(table.toString() + '\n', 'data');

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}

/**
 * Export Glossary to file
 * @param {string} glossaryId Glossary id
 * @param {string} glossaryName Glossary name
 * @param {string} file File name
 * @param {boolean} includeMeta True to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties True to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function exportGlossarySchemaToFile(
  glossaryId: string,
  glossaryName: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  objectType: GlossaryObjectType
): Promise<boolean> {
  const name = glossaryName ? glossaryName : glossaryId;
  let exportData: GlossarySchemaExportInterface;
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${name}...`
  );
  try {
    if (glossaryId) {
      exportData = await exportGlossarySchema(glossaryId);
      if (!file) {
        file = getTypedFilename(glossaryId, 'glossary');
      }
    } else {
      exportData = await exportGlossarySchemaByName(glossaryName, objectType);
      if (!file) {
        file = getTypedFilename(glossaryName, 'glossary');
      }
    }
    const filePath = getFilePath(file, true);
    updateProgressIndicator(indicatorId, `Saving ${name} to ${filePath}...`);
    saveJsonToFile(
      exportData,
      filePath,
      includeMeta,
      false,
      keepModifiedProperties
    );
    stopProgressIndicator(
      indicatorId,
      `Exported glossary ${name} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting glossary ${name} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Export all glossaries to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {glossaryExportOptions} options export internal schemas
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportGlossarySchemasToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  options: GlossarySchemaExportOptions = {
    includeInternal: false,
  },
  objectType: GlossaryObjectType
): Promise<boolean> {
  try {
    const exportData = await exportGlossarySchemas(options, objectType);
    if (!file) {
      file = getTypedFilename(`allGlossaries`, 'glossary');
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
    printError(error, `Error exporting glossaries to file`);
  }
  return false;
}

/**
 * Export all glossaries to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {GlossarySchemaExportOptions} options export options
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportGlossarySchemasToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  options: GlossarySchemaExportOptions = {
    includeInternal: false,
  },
  objectType: GlossaryObjectType
): Promise<boolean> {
  try {
    const exportData = await exportGlossarySchemas(options, objectType);
    for (const [glossaryName, GlossaryObjectType] of Object.entries(
      exportData.glossarySchema
    )) {
      saveToFile(
        'glossarySchema',
        GlossaryObjectType,
        'id',
        getFilePath(getTypedFilename(glossaryName, 'glossary'), true),
        includeMeta,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting glossaries to files`);
  }
  return false;
}

/**
 * Import a glossary from file
 * @param {string} glossaryId glossary id
 * @param {string} glossaryName glossary name
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @param {string} file import file name
 * @param {glossaryImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importGlossarySchemaFromFile(
  glossaryId: string,
  glossaryName: string,
  objectType: GlossaryObjectType,
  file: string,
  options: GlossarySchemaImportOptions = {
    includeInternal: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing glossary...'
    );
    const importData = getGlossarySchemaExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing glossary...');
    if (glossaryId) {
      await importGlossarySchemas(
        importData,
        glossaryId,
        undefined,
        undefined,
        options
      );
    } else if (glossaryName) {
      await importGlossarySchemas(
        importData,
        undefined,
        glossaryName,
        objectType,
        options
      );
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported glossary ${glossaryId}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing glossary ${glossaryId ? glossaryId : glossaryName}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import glossaries from file
 * @param {String} file file name
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @param {glossaryImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importGlossarySchemasFromFile(
  file: string,
  objectType: GlossaryObjectType,
  options: GlossarySchemaImportOptions = {
    includeInternal: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing glossaries...'
    );
    debugMessage(`importGlossarySchemasFromFile: importing ${file}`);
    const importData = getGlossarySchemaExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing glossaries...');
    await importGlossarySchemas(
      importData,
      undefined,
      undefined,
      objectType,
      options
    );
    stopProgressIndicator(
      indicatorId,
      `Successfully imported glossaries.`,
      'success'
    );
    debugMessage(`importGlossarySchemasFromFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing glossaries inside SchemasFromFile.`,
      'fail'
    );
    printError(error, `Error importing glossaries from file`);
  }
  return false;
}

/**
 * Import all glossaries from separate files
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @param {glossaryImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importGlossarySchemasFromFiles(
  objectType: GlossaryObjectType,
  options: GlossarySchemaImportOptions = {
    includeInternal: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const ids = fs.readdirSync(getWorkingDirectory());
    const glossaryFiles = ids.filter((id) =>
      id.toLowerCase().endsWith('.glossary.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      glossaryFiles.length,
      'Importing glossaries...'
    );
    for (const file of glossaryFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing glossaries from file ${file}...`
        );

        await importGlossarySchemasFromFile(file, objectType, options);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing glossaries from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`One or more errors importing glossaries`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported glossaries.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error(s) importing glossaries.`,
      'fail'
    );
    printError(error, `Error importing glossaries from files`);
  }
  return false;
}

/**
 * Import first glossary from file
 * @param {string} file import file name
 * @param {glossaryImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstGlossaryFromFile(
  file: string,
  options: GlossarySchemaImportOptions = {
    includeInternal: false,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing glossary...'
    );
    const importData = getGlossarySchemaExportFromFile(getFilePath(file));
    const ids = Object.keys(importData.glossarySchema);
    if (ids.length === 0)
      throw new FrodoError(`No glossaries found in import data`);
    await importGlossarySchemas(
      importData,
      ids[0],
      undefined,
      undefined,
      options
    );
    stopProgressIndicator(
      indicatorId,
      `Imported glossary from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing glossary from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete glossary.
 * @param {string} glossaryId glossary id
 * @param {string} glossaryName glossary name
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteGlossarySchema(
  glossaryId: string,
  glossaryName: string,
  objectType?: GlossaryObjectType
): Promise<boolean> {
  const glossary = glossaryId ? glossaryId : glossaryName;
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting glossary ${glossary}...`
  );
  try {
    let result;
    if (glossaryId) {
      result = await _deleteGlossary(glossaryId);
    } else if (glossaryName) {
      result = await _deleteGlossaryByName(glossaryName, objectType);
    }

    if (!result) {
      throw new FrodoError(`Failed to delete glossary ${glossary}`);
    }

    stopProgressIndicator(
      spinnerId,
      `Deleted glossary ${glossary}.`,
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
 * Delete glossaries.
 * @param {GlossaryObjectType} objectType Filters glossary schemas by type: role, entitlement, application, or account
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteGlossarySchemas(
  objectType?: GlossaryObjectType
): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting glossaries...`
  );
  try {
    await _deleteGlossarys(objectType);
    stopProgressIndicator(spinnerId, `Deleted glossaries.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Get a glossary export from json file.
 *
 * @param file The path to the glossary export file
 * @returns The glossary export
 */
export function getGlossarySchemaExportFromFile(
  file: string
): GlossarySchemaExportInterface {
  return JSON.parse(
    fs.readFileSync(file, 'utf8')
  ) as GlossarySchemaExportInterface;
}
