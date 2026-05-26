import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { CertificationTemplateSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaCertificationTemplateApi';
import {
  CertificationTemplateDeleteOptions,
  CertificationTemplateExportInterface,
  CertificationTemplateExportOptions,
  CertificationTemplateImportOptions,
} from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaCertificationTemplateOps';
import fs from 'fs';

import {
  createKeyValueTable,
  createProgressIndicator,
  createTable,
  debugMessage,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../../../utils/Console';
import * as EmailTemplate from '../../EmailTemplateOps';
import { errorHandler } from '../../utils/OpsUtils';
import wordwrap from '../../utils/Wordwrap';

const {
  getTypedFilename,
  saveToFile,
  saveJsonToFile,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const {
  importCertificationTemplates,
  readCertificationTemplates,
  exportCertificationTemplate,
  exportCertificationTemplateByName,
  exportCertificationTemplates,
  deleteCertificationTemplate: _deleteCertification,
  deleteCertificationTemplateByName: _deleteCertificationByName,
  deleteCertificationTemplates: _deleteCertifications,
} = frodo.cloud.iga.certificationTemplate;

/**
 * List all the certifications
 * @param {boolean} long Long version, all the fields
 * @param {boolean} includeEventTemplates include certification templates used in IGA events. Default: false.
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listCertifications(
  long: boolean = false,
  includeEventTemplates: boolean = false
): Promise<boolean> {
  try {
    const certifications = await readCertificationTemplates(
      includeEventTemplates
    );
    if (!long) {
      for (const certification of certifications) {
        printMessage(`${certification.name}`, 'data');
      }
      return true;
    }
    const table = createTable([
      'ID',
      'Name',
      'Status',
      'StagingEnabled',
      'CertificationType',
      'isEventBased',
      'Description',
    ]);
    for (const certification of certifications) {
      table.push([
        certification.id,
        wordwrap(certification.name, 40),
        certification.status === 'active'
          ? 'active'['brightGreen']
          : 'pending'['brightRed'],
        certification.stagingEnabled
          ? 'true'['brightGreen']
          : 'false'['brightRed'],
        certification.certificationType,
        certification.isEventBased
          ? 'true'['brightGreen']
          : 'false'['brightRed'],
        wordwrap(certification.description, 30),
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
 * Describe a certification
 * @param {string} certificationId certification id
 * @param {string} certificationName certification name
 * @param {string} file the certification export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeCertification(
  certificationId?: string,
  certificationName?: string,
  file?: string
): Promise<boolean> {
  try {
    let certData: CertificationTemplateExportInterface;

    if (file) {
      certData = getCertificationExportFromFile(getFilePath(file));
      if (!certificationId && !certificationName) {
        const certIds = Object.keys(certData.certificationTemplate);

        if (certIds.length === 0) {
          throw new FrodoError(
            `No certification template found in export file ${file}`
          );
        }

        certificationId = certIds[0];
      }

      if (certificationName && !certificationId) {
        const certEntries = Object.entries(certData.certificationTemplate) as [
          string,
          CertificationTemplateSkeleton,
        ][];

        const foundEntry = certEntries.find(
          ([, cert]) => cert.name === certificationName
        );

        if (!foundEntry) {
          throw new FrodoError(
            `Certification Template named "${certificationName}" not found in file ${file}`
          );
        }

        certificationId = foundEntry[0];
      }
    } else {
      if (certificationId) {
        certData = await exportCertificationTemplate(certificationId);
      } else if (certificationName) {
        certData = await exportCertificationTemplateByName(certificationName);
      } else {
        throw new FrodoError(
          'Either certification id, certification name, or file must be provided.'
        );
      }

      const certIds = Object.keys(certData.certificationTemplate);

      if (certIds.length === 0) {
        throw new FrodoError('No certification templates returned.');
      }
      certificationId = certIds[0];

      if (!certificationId) {
        const ids = Object.keys(certData.certificationTemplate);
        if (ids.length === 0)
          throw new FrodoError(
            `No certifications found in export file ${file}`
          );
        certificationId = ids[0];
      }
    }

    // Certification Details
    const certification = certData.certificationTemplate[certificationId];
    printMessage('Certification Template', 'data');
    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], certification.id]);
    table.push(['Name'['brightCyan'], certification.name]);
    table.push([
      'Status'['brightCyan'],
      certification.status === 'active'
        ? 'active'['brightGreen']
        : 'pending'['brightRed'],
    ]);
    table.push([
      'CertificationType'['brightCyan'],
      certification.certificationType,
    ]);
    table.push([
      'StagingEnabled'['brightCyan'],
      certification.stagingEnabled
        ? 'true'['brightGreen']
        : 'false'['brightRed'],
    ]);
    table.push([
      'isEventBased'['brightCyan'],
      certification.isEventBased ? 'true'['brightGreen'] : 'false'['brightRed'],
    ]);
    table.push(['Description'['brightCyan'], certification.description]);

    printMessage(table.toString() + '\n', 'data');

    // Email Templates
    if (Object.entries(certData.emailTemplate).length) {
      printMessage(
        `\nEmail Templates (${Object.entries(certData.emailTemplate).length}):`,
        'data'
      );
      for (const templateData of Object.values(certData.emailTemplate)) {
        printMessage(
          `- ${EmailTemplate.getOneLineDescription(templateData)}`,
          'data'
        );
      }
    } else {
      printMessage(
        `\nEmail Templates (${Object.entries(certData.emailTemplate).length})\n`,
        'data'
      );
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}

/**
 * Export certification to file
 * @param {string} certificationId certification id
 * @param {string} certificationName certification name
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {CertificationTemplateExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportCertificationToFile(
  certificationId: string,
  certificationName: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  options: CertificationTemplateExportOptions = {
    deps: true,
    includeEventTemplates: false,
  }
): Promise<boolean> {
  const name = certificationName ? certificationName : certificationId;
  let exportData: CertificationTemplateExportInterface;
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${name}...`
  );
  try {
    if (certificationId) {
      exportData = await exportCertificationTemplate(certificationId, options);
      if (!file) {
        file = getTypedFilename(certificationId, 'certification');
      }
    } else {
      exportData = await exportCertificationTemplateByName(
        certificationName,
        options
      );
      if (!file) {
        file = getTypedFilename(certificationName, 'certification');
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
      `Exported certification ${name} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting certification ${name} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Export all certifications to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {CertificationTemplateExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportCertificationsToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  options: CertificationTemplateExportOptions = {
    deps: true,
    includeEventTemplates: false,
  }
): Promise<boolean> {
  try {
    const exportData = await exportCertificationTemplates(
      options,
      errorHandler
    );
    if (!file) {
      file = getTypedFilename(`allCertifications`, 'certification');
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
    printError(error, `Error exporting certifications to file`);
  }
  return false;
}

/**
 * Export all certifications to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {CertificationTemplateExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportCertificationsToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  options: CertificationTemplateExportOptions = {
    deps: true,
    includeEventTemplates: false,
  }
): Promise<boolean> {
  try {
    const exportData = await exportCertificationTemplates(
      options,
      errorHandler
    );
    for (const [certificationName, certificationTemplate] of Object.entries(
      exportData.certificationTemplate
    )) {
      saveToFile(
        'certificationTemplate',
        certificationTemplate,
        'id',
        getFilePath(getTypedFilename(certificationName, 'certification'), true),
        includeMeta,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting certifications to files`);
  }
  return false;
}

/**
 * Import a certification from file
 * @param {string} certificationId certification id
 * @param {string} certificationName certification name
 * @param {string} file import file name
 * @param {CertificationTemplateImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importCertificationFromFile(
  certificationId: string,
  certificationName: string,
  file: string,
  options: CertificationTemplateImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing certification...'
    );
    const importData = getCertificationExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing certification...');
    if (certificationId) {
      await importCertificationTemplates(
        importData,
        certificationId,
        undefined,
        options
      );
    } else if (certificationName) {
      await importCertificationTemplates(
        importData,
        undefined,
        certificationName,
        options
      );
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported certification ${certificationId}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing certification ${certificationId}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import certifications from file
 * @param {String} file file name
 * @param {CertificationTemplateImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importCertificationsFromFile(
  file: string,
  options: CertificationTemplateImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing certifications...'
    );
    debugMessage(`importCertificationsFromFile: importing ${file}`);
    const importData = getCertificationExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing certifications...');
    await importCertificationTemplates(
      importData,
      undefined,
      undefined,
      options
    );
    stopProgressIndicator(
      indicatorId,
      `Successfully imported certifications.`,
      'success'
    );
    debugMessage(`importCertificationsFromFile: end`);
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing certifications.`,
      'fail'
    );
    printError(error, `Error importing certifications from file`);
  }
  return false;
}

/**
 * Import all certifications from separate files
 * @param {CertificationTemplateImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importCertificationsFromFiles(
  options: CertificationTemplateImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const certificationFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.certification.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      certificationFiles.length,
      'Importing certifications...'
    );
    for (const file of certificationFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing certifications from file ${file}...`
        );
        await importCertificationsFromFile(file, options);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing certifications from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(
        `One or more errors importing certifications`,
        errors
      );
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported certifications.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error(s) importing certifications.`,
      'fail'
    );
    printError(error, `Error importing certifications from files`);
  }
  return false;
}

/**
 * Import first certification from file
 * @param {string} file import file name
 * @param {CertificationTemplateImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstCertificationFromFile(
  file: string,
  options: CertificationTemplateImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing certification...'
    );
    const importData = getCertificationExportFromFile(getFilePath(file));
    const ids = Object.keys(importData.certificationTemplate);
    if (ids.length === 0)
      throw new FrodoError(`No certifications found in import data`);
    await importCertificationTemplates(importData, ids[0], undefined, options);
    stopProgressIndicator(
      indicatorId,
      `Imported certification from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing certification from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete certification either by Id or Name
 * @param {string} certificationId certification id
 * @param {string} certificationName certification name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteCertification(
  certificationId: string,
  certificationName: string
): Promise<boolean> {
  const name = certificationId ? certificationId : certificationName;
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting certification ${name}...`
  );
  try {
    let result;
    if (certificationId) {
      result = await _deleteCertification(certificationId);
    } else if (certificationName) {
      result = await _deleteCertificationByName(certificationName);
    }

    if (!result) {
      throw new FrodoError(`Failed to delete certification ${name}`);
    }

    stopProgressIndicator(
      spinnerId,
      `Deleted certification ${name}.`,
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
 * Delete certifications.
 * @param {CertificationTemplateDeleteOptions} options delete options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteCertifications(
  options: CertificationTemplateDeleteOptions = {
    includeEventTemplates: false,
  }
): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting certifications...`
  );
  try {
    await _deleteCertifications(options);
    stopProgressIndicator(spinnerId, `Deleted certifications.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Get a certification export from json file.
 *
 * @param file The path to the certification export file
 * @returns The certification export
 */
export function getCertificationExportFromFile(
  file: string
): CertificationTemplateExportInterface {
  const exportData = JSON.parse(
    fs.readFileSync(file, 'utf8')
  ) as CertificationTemplateExportInterface;

  return exportData;
}
