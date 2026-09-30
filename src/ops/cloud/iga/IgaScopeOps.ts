import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { ScopeSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaScopeApi';
import { ScopeExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaScopeOps';
import fs from 'fs';

import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
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
  importScopes,
  readScopes,
  exportScope,
  exportScopes,
  deleteScopeByName: _deleteScopeByName,
  deleteScopes: _deleteScopes,
} = frodo.cloud.iga.scope;
/**
 * List all the scopes
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listScopes(long: boolean = false): Promise<boolean> {
  let scopes: ScopeSkeleton[] = [];
  try {
    scopes = await readScopes();
    if (!long) {
      for (const scope of scopes) {
        printMessage(`${scope.id ? scope.name : scope.entity}`, 'data');
      }
      return true;
    } else {
      const table = createTable([
        'ID',
        'Name',
        'Description',
        'Status',
        'Entity',
        'Source Conditions',
        'Target Conditions',
        'Permissions',
      ]);
      for (const scope of scopes) {
        const sourceTypes = scope.sourceCondition
          ? Object.keys(scope.sourceCondition).filter(
              (k) => scope.sourceCondition[k]
            )
          : [];

        const targetTypes = scope.targetCondition
          ? Object.keys(scope.targetCondition).filter(
              (k) => scope.targetCondition[k]
            )
          : [];

        const permissionEntries = scope.permissions
          ? Object.entries(scope.permissions)
          : [];

        const enabledPermissions = permissionEntries.filter(
          ([, v]) => v === true
        ).length;
        const totalPermissions = permissionEntries.length;

        table.push([
          scope.id,
          scope.name,
          scope.description ?? '',
          scope.status === 'active'
            ? 'active'['brightGreen']
            : scope.status === 'inactive'
              ? 'inactive'['brightRed']
              : '-',
          scope.entity?.displayName ??
            (Array.isArray(scope.entity?.type)
              ? scope.entity.type.join(', ')
              : scope.entity?.type) ??
            '-',
          sourceTypes.length ? sourceTypes.join(', ') : '-',
          targetTypes.length ? targetTypes.join(', ') : '-',
          totalPermissions
            ? `${enabledPermissions} / ${totalPermissions}`
            : '-',
        ]);
      }

      printMessage(table.toString(), 'data');
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Describe a scope
 * @param {string} id scope id
 * @param {string} file the scope export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeScope(
  name?: string,
  file?: string
): Promise<boolean> {
  try {
    let scope: ScopeSkeleton;

    if (file) {
      const data = fs.readFileSync(file, 'utf8');
      const scopeExport: ScopeExportInterface = JSON.parse(data);
      const ids = Object.keys(scopeExport.scope);
      if (ids.length === 0) {
        throw new FrodoError(`No scopes found in export file ${file}`);
      }
      // If a name was provided, find the matching scope in the file
      if (name) {
        const match = Object.values(scopeExport.scope).find(
          (s) => s.name === name
        );
        if (!match) {
          throw new FrodoError(
            `No scope named '${name}' found in export file ${file}`
          );
        }
        scope = match;
      } else {
        scope = scopeExport.scope[ids[0]];
      }
    } else if (name) {
      const scopes = await readScopes();
      const match = scopes.find((s) => s.name === name);
      if (!match) {
        throw new FrodoError(`No scope named '${name}' found`);
      }
      scope = match;
    } else {
      const scopes = await readScopes();
      if (scopes.length === 0) {
        throw new FrodoError(`No scopes found`);
      }
      scope = scopes[0];
    }

    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], scope.id]);
    table.push(['Name'['brightCyan'], scope.name]);
    table.push(['Description'['brightCyan'], scope.description ?? '']);
    table.push([
      'Status'['brightCyan'],
      scope.status === 'active'
        ? 'active'['brightGreen']
        : scope.status === 'inactive'
          ? 'inactive'['brightRed']
          : '-',
    ]);
    if (scope.entity) {
      if (scope.entity.displayName)
        table.push(['Entity'['brightCyan'], scope.entity.displayName]);
      if (scope.entity.type) {
        const typeStr = Array.isArray(scope.entity.type)
          ? scope.entity.type.join(', ')
          : scope.entity.type;
        table.push(['Entity Type'['brightCyan'], typeStr]);
      }
      if (scope.entity.class)
        table.push(['Entity Class'['brightCyan'], scope.entity.class]);
    }
    const sourceKeys = scope.sourceCondition
      ? Object.keys(scope.sourceCondition).filter(
          (k) => scope.sourceCondition[k]
        )
      : [];
    table.push([
      'Source Conditions'['brightCyan'],
      sourceKeys.length ? sourceKeys.join(', ') : '-',
    ]);
    const targetKeys = scope.targetCondition
      ? Object.keys(scope.targetCondition).filter(
          (k) => scope.targetCondition[k]
        )
      : [];
    table.push([
      'Target Conditions'['brightCyan'],
      targetKeys.length ? targetKeys.join(', ') : '-',
    ]);
    if (scope.permissions) {
      const enabled = Object.entries(scope.permissions)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      getTableRowsFromArray(table, `Permissions (${enabled.length})`, enabled);
    } else {
      table.push(['Permissions'['brightCyan'], '-']);
    }
    printMessage(table.toString() + '\n', 'data');
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
} /**
 * Export scope to file
 * @param {string} id scope id
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract extracts the scripts from the export into separate files if true. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportScopeToFile(
  name: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${name}...`
  );
  try {
    const scopes = await readScopes();
    const scope = scopes.find((s) => s.name === name);
    if (!scope) {
      throw new FrodoError(`No scope named '${name}' found`);
    }
    const exportData = await exportScope(scope.id);
    if (!file) {
      file = getTypedFilename(scope.name, 'scope');
    }
    const filePath = getFilePath(file, true);
    updateProgressIndicator(
      indicatorId,
      `Saving ${scope.name} to ${filePath}...`
    );
    saveJsonToFile(
      exportData,
      filePath,
      includeMeta,
      false,
      keepModifiedProperties
    );
    stopProgressIndicator(
      indicatorId,
      `Exported scope ${scope.name} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting scope ${name} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
} /**
 * Export all scopes to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportScopesToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportScopes();
    if (!file) {
      file = getTypedFilename(`allScopes`, 'scope');
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
    printError(error, `Error exporting scope to file`);
  }
  return false;
}

/**
 * Export all scope to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract extracts the scripts from the exports into separate files if true. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportScopesToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false
): Promise<boolean> {
  try {
    const exportData = await exportScopes();
    for (const [, scope] of Object.entries(exportData.scope)) {
      saveToFile(
        'scope',
        scope,
        'name',
        getFilePath(getTypedFilename(scope.name, 'scope'), true),
        includeMeta,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting scope to files`);
  }
  return false;
}

/**
 * Import a scope from file
 * @param {string} name scope id
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importScopeFromFile(
  name: string,
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing scope...'
    );
    updateProgressIndicator(indicatorId, 'Importing scope...');
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const existingScopes = await readScopes();
    const scopes: ScopeExportInterface = { scope: {} };
    for (const id of Object.keys(importData.scope)) {
      const scope = importData.scope[id];
      if (scope.name !== name) continue;
      if (
        existingScopes.find((s) => s.id === scope.id || s.name === scope.name)
      )
        continue;
      scopes.scope[id] = scope;
    }

    await importScopes(scopes);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported scope ${name}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing scope ${name}`, 'fail');
    printError(error);
  }
  return false;
}
/**
 * Import scopes from file
 * @param {String} file file name

 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importScopesFromFile(file: string): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing scopes...'
    );
    updateProgressIndicator(indicatorId, 'Importing scopes...');
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const existingScopes = await readScopes();
    const scopes: ScopeExportInterface = { scope: {} };
    for (const id of Object.keys(importData.scope)) {
      const scope = importData.scope[id];
      if (
        existingScopes.find((s) => s.id === scope.id || s.name === scope.name)
      )
        continue;
      scopes.scope[id] = scope;
    }

    await importScopes(scopes);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported scopes.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing scopes.`, 'fail');
    printError(error, `Error importing scopes from file`);
  }
  return false;
}

/**
 * Import all scopes from separate files
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importScopesFromFiles(): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const scopeFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.scope.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      scopeFiles.length,
      'Importing scopes...'
    );

    const existingScopes = await readScopes();

    for (const file of scopeFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing scope from file ${file}...`
        );
        const importData = JSON.parse(
          fs.readFileSync(getFilePath(file), 'utf8')
        );

        const scopes: ScopeExportInterface = { scope: {} };
        for (const id of Object.keys(importData.scope)) {
          const scope = importData.scope[id];
          if (
            existingScopes.find(
              (s) => s.id === scope.id || s.name === scope.name
            )
          )
            continue;
          scopes.scope[id] = scope;
        }

        await importScopes(scopes);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing scopes from ${file}`, error)
        );
      }
    }
    if (errors.length > 0)
      throw new FrodoError(`One or more errors importing scopes`, errors);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported scopes.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error(s) importing scopes.`, 'fail');
    printError(error, `Error importing scopes from files`);
  }
  return false;
}
/**
 * Import first scope from file
 * @param {string} file import file name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstScopeFromFile(file: string): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing scope...'
    );
    const filePath = getFilePath(file);
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const ids = Object.keys(importData.scope);
    if (ids.length === 0)
      throw new FrodoError(`No scopes found in import data`);

    const existingScopes = await readScopes();
    const scopes: ScopeExportInterface = { scope: {} };
    for (const id of ids) {
      const scope = importData.scope[id];
      if (
        existingScopes.find((s) => s.id === scope.id || s.name === scope.name)
      )
        continue;
      scopes.scope[id] = scope;
      break; // only first
    }

    await importScopes(scopes);
    stopProgressIndicator(
      indicatorId,
      `Imported scope from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing scope from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete scope by name.
 * @param {string} name scope name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteScopeByName(name: string): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting scope ${name}...`
  );
  try {
    const result = await _deleteScopeByName(name);
    if (!result) {
      throw new FrodoError(`Failed to delete scope ${name}`);
    }
    stopProgressIndicator(spinnerId, `Deleted scope ${name}.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}
/**
 * Delete scopes. If both deleteDraft and deletePublished are truthy or falsy, attempt to delete all of both types, otherwise deletes only those of one type.
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteScopes(): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting scopes...`
  );
  try {
    await _deleteScopes();
    stopProgressIndicator(spinnerId, `Deleted scopes.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}
