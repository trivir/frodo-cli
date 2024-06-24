import { frodo } from '@rockcarver/frodo-lib';

import {
  createKeyValueTable,
  createTable,
  printError,
  printMessage,
} from '../utils/Console';

const { readRealm, readRealms, readRealmByName, exportRealms, updateRealm } =
  frodo.realm;

const { getTypedFilename, saveToFile, saveJsonToFile, getFilePath } =
  frodo.utils;

/**
 * List realms
 * @param {boolean} long Long list format with details
 */
export async function listRealms(long = false) {
  try {
    const realms = await readRealms();
    if (long) {
      const table = createTable([
        'Name'['brightCyan'],
        'Status'['brightCyan'],
        'Custom Domains'['brightCyan'],
        'Parent'['brightCyan'],
      ]);
      realms.forEach((realmConfig) => {
        table.push([
          realmConfig.name,
          realmConfig.active
            ? 'active'['brightGreen']
            : 'inactive'['brightRed'],
          realmConfig.aliases.join('\n'),
          realmConfig.parentPath,
        ]);
      });
      printMessage(table.toString(), 'data');
    } else {
      realms.forEach((realmConfig) => {
        printMessage(realmConfig.name, 'data');
      });
    }
  } catch (error) {
    printMessage(error, 'error');
    printMessage(`Error listing realms: ${error.message}`, 'error');
    printMessage(error.response?.data, 'error');
  }
}

/**
 * Export realm to file by id
 * @param {string} realmId realm id
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportRealmById(
  realmId: string,
  file: string,
  includeMeta: boolean = true
): Promise<boolean> {
  try {
    const realm = await readRealm(realmId);
    let fileName = getTypedFilename(realmId, `realm`);
    if (file) {
      fileName = file;
    }
    saveToFile(
      'realm',
      [realm],
      '_id',
      getFilePath(fileName, true),
      includeMeta
    );
    return true;
  } catch (error) {
    printError(error, `Error exporting realm to file`);
  }
  return false;
}

/**
 * Export realm to file by name
 * @param {string} realmName realm name
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportRealmByName(
  realmName: string,
  file: string,
  includeMeta: boolean = true
): Promise<boolean> {
  try {
    const realm = await readRealmByName(realmName);
    let fileName = getTypedFilename(
      !realmName || realmName === '/' ? 'root' : realmName,
      `realm`
    );
    if (file) {
      fileName = file;
    }
    saveToFile(
      'realm',
      [realm],
      '_id',
      getFilePath(fileName, true),
      includeMeta
    );
    return true;
  } catch (error) {
    printError(error, `Error exporting realm to file`);
  }
  return false;
}

/**
 * Export all realms to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportRealmsToFile(
  file: string,
  includeMeta: boolean = true
): Promise<boolean> {
  try {
    const exportData = await exportRealms();
    let fileName = getTypedFilename(`allRealms`, `realm`);
    if (file) {
      fileName = file;
    }
    saveJsonToFile(exportData, getFilePath(fileName, true), includeMeta);
    return true;
  } catch (error) {
    printError(error, `Error exporting realms to file`);
  }
  return false;
}

/**
 * Export all realms to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportRealmsToFiles(
  includeMeta: boolean = true
): Promise<boolean> {
  try {
    const realms = await readRealms();
    for (const realm of realms) {
      const fileName = getTypedFilename(
        !realm.name || realm.name === '/' ? 'root' : realm.name,
        'realm'
      );
      saveToFile(
        'realm',
        realm,
        '_id',
        getFilePath(fileName, true),
        includeMeta
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting realms to files`);
  }
  return false;
}

/**
 * Describe realm
 * @param {String} realm realm name
 */
export async function describeRealm(realm: string) {
  try {
    const realmConfig = await readRealmByName(realm);
    const table = createKeyValueTable();
    table.push(['Name'['brightCyan'], realmConfig.name]);
    table.push([
      'Status'['brightCyan'],
      realmConfig.active ? 'active'['brightGreen'] : 'inactive'['brightRed'],
    ]);
    table.push([
      'Custom Domains'['brightCyan'],
      realmConfig.aliases.join('\n'),
    ]);
    table.push(['Parent'['brightCyan'], realmConfig.parentPath]);
    table.push(['Id'['brightCyan'], realmConfig._id]);
    printMessage(table.toString(), 'data');
  } catch (error) {
    printMessage(`Realm ${realm} not found!`, 'error');
  }
}

/**
 * Add custom DNS domain name (realm DNS alias)
 * @param {String} realm realm name
 * @param {String} domain domain name
 */
export async function addCustomDomain(realm: string, domain: string) {
  try {
    let realmConfig = await readRealmByName(realm);
    let exists = false;
    realmConfig.aliases.forEach((alias) => {
      if (domain.toLowerCase() === alias.toLowerCase()) {
        exists = true;
      }
    });
    if (!exists) {
      try {
        realmConfig.aliases.push(domain.toLowerCase());
        realmConfig = await updateRealm(realmConfig._id, realmConfig);
        const table = createKeyValueTable();
        table.push(['Name'['brightCyan'], realmConfig.name]);
        table.push([
          'Status'['brightCyan'],
          realmConfig.active
            ? 'active'['brightGreen']
            : 'inactive'['brightRed'],
        ]);
        table.push([
          'Custom Domains'['brightCyan'],
          realmConfig.aliases.join('\n'),
        ]);
        table.push(['Parent'['brightCyan'], realmConfig.parentPath]);
        table.push(['Id'['brightCyan'], realmConfig._id]);
        printMessage(table.toString());
      } catch (error) {
        printMessage(`Error adding custom domain: ${error.message}`, 'error');
      }
    }
  } catch (error) {
    printMessage(`${error.message}`, 'error');
  }
}

/**
 * Remove custom DNS domain name (realm DNS alias)
 * @param {String} realm realm name
 * @param {String} domain domain name
 */
export async function removeCustomDomain(realm: string, domain: string) {
  try {
    let realmConfig = await readRealmByName(realm);
    const aliases = realmConfig.aliases.filter(
      (alias) => domain.toLowerCase() !== alias.toLowerCase()
    );
    if (aliases.length < realmConfig.aliases.length) {
      try {
        realmConfig.aliases = aliases;
        realmConfig = await updateRealm(realmConfig._id, realmConfig);
        const table = createKeyValueTable();
        table.push(['Name'['brightCyan'], realmConfig.name]);
        table.push([
          'Status'['brightCyan'],
          realmConfig.active
            ? 'active'['brightGreen']
            : 'inactive'['brightRed'],
        ]);
        table.push([
          'Custom Domains'['brightCyan'],
          realmConfig.aliases.join('\n'),
        ]);
        table.push(['Parent'['brightCyan'], realmConfig.parentPath]);
        table.push(['Id'['brightCyan'], realmConfig._id]);
        printMessage(table.toString());
      } catch (error) {
        printMessage(`Error removing custom domain: ${error.message}`, 'error');
      }
    }
  } catch (error) {
    printMessage(`${error.message}`, 'error');
  }
}
