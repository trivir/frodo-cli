import { frodo, FrodoError, state } from '@rockcarver/frodo-lib';
import {
  type ApplicationExportInterface,
  type ApplicationExportOptions,
  type ApplicationImportOptions,
} from '@rockcarver/frodo-lib/types/ops/ApplicationOps';
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
import wordwrap from './utils/Wordwrap';

const {
  getTypedFilename,
  titleCase,
  getFilePath,
  getWorkingDirectory,
  saveJsonToFile,
} = frodo.utils;
const {
  readApplications: _readApplications,
  deleteApplication: _deleteApplication,
  deleteApplicationByName: _deleteApplicationByName,
  deleteApplications: _deleteApplications,
  exportApplication: _exportApplication,
  exportApplicationByName: _exportApplicationByName,
  exportApplications: _exportApplications,
  importApplication: _importApplication,
  importApplicationByName: _importApplicationByName,
  importFirstApplication: _importFirstApplication,
  importApplications: _importApplications,
  queryApplications,
} = frodo.app;

/**
 * List applications
 */
export async function listApplications(long = false): Promise<boolean> {
  try {
    const applications = await _readApplications();
    applications.sort((a, b) => a.name.localeCompare(b.name));
    if (long) {
      const table = createTable([
        'Name',
        'Id',
        'Template',
        {
          hAlign: 'right',
          content: 'Version',
        },
        {
          hAlign: 'right',
          content: 'Authoritative',
        },
        'Description',
      ]);
      applications.forEach((app) => {
        table.push([
          app.name,
          app._id,
          app.templateName,
          {
            hAlign: 'right',
            content: app.templateVersion,
          },
          {
            hAlign: 'right',
            content: app.authoritative,
          },
          wordwrap(app.description, 30),
        ]);
      });
      printMessage(table.toString(), 'data');
    } else {
      applications.forEach((app) => {
        printMessage(`${app.name}`, 'data');
      });
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Delete application
 * @param {string | undefined} applicationId application id
 * @param {string | undefined} applicationName application name
 * @param {boolean} deep deep delete (include dependencies)
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteApplication(
  applicationId: string | undefined,
  applicationName: string | undefined,
  deep: boolean
): Promise<boolean> {
  const name = applicationName ?? applicationId;
  let indicatorId: string;
  try {
    debugMessage(`cli.ApplicationOps.deleteApplication: begin`);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Deleting ${name}...`
    );
    if (applicationId) {
      await _deleteApplication(applicationId, deep);
    } else {
      await _deleteApplicationByName(applicationName, deep);
    }
    stopProgressIndicator(indicatorId, `Deleted ${name}`, 'success');
    debugMessage(`cli.ApplicationOps.deleteApplication: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error deleting ${name}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Delete all applications
 * @param {boolean} deep deep delete (include dependencies)
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteApplications(deep: boolean): Promise<boolean> {
  let indicatorId: string;
  try {
    debugMessage(`cli.ApplicationOps.deleteApplications: begin`);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Deleting applications...`
    );
    const deleted = await _deleteApplications(deep);
    stopProgressIndicator(
      indicatorId,
      `Deleted ${deleted.length} applications`,
      'success'
    );
    debugMessage(`cli.ApplicationOps.deleteApplications: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error deleting applications`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Export application to file
 * @param {string | undefined} applicationId application id
 * @param {string | undefined} applicationName application name
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {ApplicationExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportApplicationToFile(
  applicationId: string | undefined,
  applicationName: string | undefined,
  file: string,
  includeMeta: boolean,
  options: ApplicationExportOptions = { useStringArrays: true, deps: true }
) {
  const name = applicationName ?? applicationId;
  let indicatorId: string;
  try {
    debugMessage(`cli.ApplicationOps.exportApplicationToFile: begin`);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Exporting ${name}...`
    );
    let fileName = getTypedFilename(name, 'application');
    if (file) {
      fileName = file;
    }
    const filePath = getFilePath(fileName, true);
    const exportData = applicationId
      ? await _exportApplication(applicationId, options)
      : await _exportApplicationByName(applicationName, options);
    saveJsonToFile(exportData, filePath, includeMeta);
    stopProgressIndicator(
      indicatorId,
      `Exported ${name} to ${filePath}.`,
      'success'
    );
    debugMessage(`cli.ApplicationOps.exportApplicationToFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error exporting ${name}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Export all applications to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {ApplicationExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportApplicationsToFile(
  file: string,
  includeMeta: boolean,
  options: ApplicationExportOptions = { useStringArrays: true, deps: true }
): Promise<boolean> {
  let indicatorId: string;
  const totalApplications = await queryApplications('true', ['_id']);
  try {
    debugMessage(`cli.ApplicationOps.exportApplicationsToFile: begin`);
    indicatorId = createProgressIndicator(
      'determinate',
      totalApplications.length,
      `Exporting applications...`
    );
    let fileName = getTypedFilename(
      `all${titleCase(frodo.utils.getRealmName(state.getRealm()))}Applications`,
      'application'
    );
    if (file) {
      fileName = file;
    }
    const filePath = getFilePath(fileName, true);
    const exportData = await _exportApplications(options, (error, result) => {
      if (error) {
        stopProgressIndicator(
          indicatorId,
          `Error exporting ${result?.application?._id}`,
          'fail'
        );
      } else {
        updateProgressIndicator(
          indicatorId,
          `Exporting ${result?.application?._id}...`
        );
      }
    });
    saveJsonToFile(exportData, filePath, includeMeta);
    stopProgressIndicator(indicatorId, `Exported all applications to ${filePath}.`);
    debugMessage(`cli.ApplicationOps.exportApplicationsToFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error exporting applications`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Export all applications to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {ApplicationExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportApplicationsToFiles(
  includeMeta: boolean,
  options: ApplicationExportOptions = { useStringArrays: true, deps: true }
) {
  debugMessage(`cli.ApplicationOps.exportApplicationsToFiles: begin`);
  const errors: Error[] = [];
  let totalindicatorId: string;
  try {
    const applications = await _readApplications();
    totalindicatorId = createProgressIndicator(
      'determinate',
      applications.length,
      'Exporting applications...'
    );
    for (const application of applications) {
      const fileindicatorId = createProgressIndicator(
        'determinate',
        1,
        `Exporting application ${application.name}...`
      );
      const file = getFilePath(
        getTypedFilename(application.name, 'application'),
        true
      );
      try {
        updateProgressIndicator(
          totalindicatorId,
          `Exporting ${application.name}.`
        );
        const exportData = await _exportApplication(application._id, options);
        saveJsonToFile(exportData, file, includeMeta);
        updateProgressIndicator(
          fileindicatorId,
          `Saving ${application.name} to ${file}.`
        );
        stopProgressIndicator(
          fileindicatorId,
          `${application.name} saved to ${file}.`
        );
      } catch (error) {
        errors.push(error);
        updateProgressIndicator(
          totalindicatorId,
          `Error exporting ${application.name}.`
        );
        stopProgressIndicator(
          fileindicatorId,
          `Error saving ${application.name} to ${file}.`,
          'fail'
        );
      }
    }
    stopProgressIndicator(totalindicatorId, `Export complete.`);
    if (errors.length > 0) {
      throw new FrodoError(
        `Error exporting applications(s) to file(s)`,
        errors
      );
    }
    debugMessage(`cli.ApplicationOps.exportApplicationsToFiles: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(
      totalindicatorId,
      `Error exporting applications(s) to file(s)`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import application from file
 * @param {string | undefined} applicationId application id
 * @param {string | undefined} applicationName application name
 * @param {string} file file name
 * @param {ApplicationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importApplicationFromFile(
  applicationId: string | undefined,
  applicationName: string | undefined,
  file: string,
  options: ApplicationImportOptions = { deps: true }
): Promise<boolean> {
  let indicatorId: string;
  const name = applicationName ?? applicationId;
  try {
    debugMessage(`cli.ApplicationOps.importApplicationFromFile: begin`);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Exporting applications...`
    );
    const data = fs.readFileSync(getFilePath(file), 'utf8');
    const fileData = JSON.parse(data);
    if (applicationId) {
      await _importApplication(applicationId, fileData, options);
    } else {
      await _importApplicationByName(applicationName, fileData, options);
    }
    stopProgressIndicator(indicatorId, `Imported ${name}`, 'success');
    debugMessage(`cli.ApplicationOps.importApplicationFromFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing ${name}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Import first application from file
 * @param {string} file file name
 * @param {ApplicationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstApplicationFromFile(
  file: string,
  options: ApplicationImportOptions = { deps: true }
): Promise<boolean> {
  let indicatorId: string;
  try {
    debugMessage(`cli.ApplicationOps.importFirstApplicationFromFile: begin`);
    const filePath = getFilePath(file);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing ${filePath}...`
    );
    const data = fs.readFileSync(filePath, 'utf8');
    const fileData = JSON.parse(data);
    await _importFirstApplication(fileData, options);
    stopProgressIndicator(indicatorId, `Imported ${filePath}`, 'success');
    debugMessage(`cli.ApplicationOps.importFirstApplicationFromFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing first application`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import applications from file
 * @param {string} file file name
 * @param {ApplicationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importApplicationsFromFile(
  file: string,
  options: ApplicationImportOptions = { deps: true }
): Promise<boolean> {
  let indicatorId: string;
  try {
    debugMessage(`cli.ApplicationOps.importApplicationsFromFile: begin`);
    const filePath = getFilePath(file);
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      `Importing ${filePath}...`
    );
    const data = fs.readFileSync(filePath, 'utf8');
    const applicationData = JSON.parse(data);
    await _importApplications(applicationData, options);
    stopProgressIndicator(indicatorId, `Imported ${filePath}`, 'success');
    debugMessage(`cli.ApplicationOps.importApplicationsFromFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing first application`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import applications from files
 * @param {ApplicationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importApplicationsFromFiles(
  options: ApplicationImportOptions = { deps: true }
): Promise<boolean> {
  const errors = [];
  let indicatorId: string;
  try {
    debugMessage(`cli.ApplicationOps.importApplicationsFromFiles: begin`);
    const names = fs.readdirSync(getWorkingDirectory());
    const files = names
      .filter((name) => name.toLowerCase().endsWith('.application.json'))
      .map((name) => getFilePath(name));
    indicatorId = createProgressIndicator(
      'determinate',
      files.length,
      'Importing applications...'
    );
    let total = 0;
    for (const file of files) {
      try {
        const data = fs.readFileSync(file, 'utf8');
        const fileData: ApplicationExportInterface = JSON.parse(data);
        const count = Object.keys(fileData.managedApplication).length;
        total += count;
        await _importApplications(fileData, options);
        updateProgressIndicator(
          indicatorId,
          `Imported ${count} application(s) from ${file}`
        );
      } catch (error) {
        errors.push(error);
        updateProgressIndicator(
          indicatorId,
          `Error importing application(s) from ${file}`
        );
        printMessage(error, 'error');
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`Error importing applications`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Finished importing ${total} application(s) from ${files.length} file(s).`
    );
    debugMessage(`cli.ApplicationOps.importApplicationsFromFiles: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing applications`);
    printMessage(error, 'error');
  }
  return false;
}
