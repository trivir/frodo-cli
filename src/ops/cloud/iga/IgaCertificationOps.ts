import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import {
  CertificationTemplateSkeleton
} from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaCertificationTemplateApi';
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
  getTableRowsFromArray,
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
  // importCertifications,
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
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listCertifications(long: boolean = false): Promise<boolean> {
  try {
    let certifications = await readCertificationTemplates();
    if (!long) {
      for (const certification of certifications) {
        printMessage(
          `${certification.name}`,
          'data'
        );
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
      'Description'
    ]);
    for (const certification of certifications) {
      // const certification = based on status?
      table.push([
        certification.id,
        certification.name,
        certification.status === 'active' ? 'active'['brightGreen'] : 'pending'['brightRed'],
        certification.stagingEnabled ? 'true'['brightGreen'] : 'false'['brightRed'],
        certification.certificationType,
        certification.isEventBased ? 'true'['brightGreen'] : 'false'['brightRed'],
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
  console.log(certificationId, certificationName, file);
  // try {
  //   let certData: CertificationTemplateExportInterface;
  //   if (file) {
  //     certData = getCertificationExportFromFile(getFilePath(file))
  //     if (!certificationId && !certificationName) {
  //       const certIds = Object.keys(certData.certificationTemplate);

  //       if (certIds.length === 0) {
  //         throw new FrodoError(
  //           `No certification template found in export file ${file}`
  //         );
  //       }

  //       certificationId = certIds[0];
  //     }

  //     if (certificationName && !certificationId) {
  //       const certEntries = Object.entries(
  //         certData.certificationTemplate
  //       ) as [string, CertificationTemplateSkeleton<any>][];

  //       const foundEntry = certEntries.find(
  //         ([, cert]) =>
  //           cert.name === certificationName
  //       );

  //       if (!foundEntry) {
  //         throw new FrodoError(
  //           `Certification Template named "${certificationName}" not found in file ${file}`
  //         );
  //       }

  //       certificationId = foundEntry[0];
  //     }
  //   } else {
  //     if (certificationId) {
  //       certData = await exportCertificationTemplate(certificationId);
  //     } else if (certificationName) {
  //       certData = await exportCertificationTemplateByName(certificationName);
  //     } else {
  //       throw new FrodoError(
  //         'Either certification id, certification name, or file must be provided.'
  //       );
  //     }

  //     const ids = Object.keys(certData.certificationTemplate);

  //     if (ids.length === 0) {
  //       throw new FrodoError('No certification templates returned.');
  //     }
  //     certificationId = ids[0]
  //   }

  //   if (!certificationId) {
  //     const ids = Object.keys(certData.certificationTemplate);
  //     if (ids.length === 0)
  //       throw new FrodoError(`No certifications found in export file ${file}`);
  //     certificationId = ids[0];
  //   }
  //   // Certification Details
  //   // id
  //   // name
  //   // status
  //   // staging enabled
  //   // cert type
  //   // isEventBased vs. templateEventType?
  //   // description
  //   // ownerInfo
  //   // notification events registered? (i.e. email templates used)
  //   // schedule id

  //   const certification = certData.certificationTemplate[certificationId];
  //   printMessage(
  //     'Certification Template',
  //     'data'
  //   );
  //   const table = createKeyValueTable();
  //   table.push(['Id'['brightCyan'], certification.id]);
  //   table.push(['Name'['brightCyan'], certification.name]);
  //   table.push([
  //     'Status'['brightCyan'],
  //     certification.status ? 'active'['brightGreen'] : 'pending'['brightRed'],
  //   ]);
  //   table.push(['CertificationType'['brightCyan'], certification.certificationType]);
  //   table.push([
  //     'StagingEnabled'['brightCyan'],
  //     certification.stagingEnabled ? 'true'['brightGreen'] : 'false'['brightRed'],
  //   ]);
  //   table.push(['isEventBased'['brightCyan'], certification.isEventBased]);
  //   table.push(['Description'['brightCyan'], certification.description]);
  //   getTableRowsFromArray(
  //     table,
  //     `Steps (${certification.steps.length})`,
  //     certification.steps.map((s) => s.name)
  //   );
  //   printMessage(table.toString() + '\n', 'data');
    
  //   // Email Templates
  //   if (Object.entries(certData.emailTemplate).length) {
  //     printMessage(
  //       `\nEmail Templates (${
  //         Object.entries(certData.emailTemplate).length
  //       }):`,
  //       'data'
  //     );
  //     for (const templateData of Object.values(certData.emailTemplate)) {
  //       printMessage(
  //         `- ${EmailTemplate.getOneLineDescription(templateData)}`,
  //         'data'
  //       );
  //     }
  //   }
  //   // Events
  //   if (Object.entries(certData.event).length) {
  //     printMessage(
  //       `\nEvents (${Object.entries(certData.event).length}):`,
  //       'data'
  //     );
  //     for (const eventData of Object.values(certData.event)) {
  //       printMessage(
  //         `- [${eventData.id['brightCyan']}] ${eventData.name}`,
  //         'data'
  //       );
  //     }
  //   }
  //   // Request Forms
  //   if (Object.entries(certData.requestForm).length) {
  //     printMessage(
  //       `\nRequest Forms (${
  //         Object.entries(certData.requestForm).length
  //       }):`,
  //       'data'
  //     );
  //     for (const formData of Object.values(certData.requestForm)) {
  //       printMessage(
  //         `- [${formData.id['brightCyan']}] ${formData.name}`,
  //         'data'
  //       );
  //     }
  //   }
  //   // Request Types
  //   if (Object.entries(certData.requestType).length) {
  //     printMessage(
  //       `\nRequest Types (${
  //         Object.entries(certData.requestType).length
  //       }):`,
  //       'data'
  //     );
  //     for (const typeData of Object.values(certData.requestType)) {
  //       printMessage(
  //         `- [${typeData.id['brightCyan']}] ${typeData.displayName}`,
  //         'data'
  //       );
  //     }
  //   }
  //   return true;
  // } catch (error) {
  //   printError(error);
  // }
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
    includeEventTemplates: true,
  }
): Promise<boolean> {
  const name = certificationName ? certificationName : certificationId;
  let exportData: CertificationTemplateExportInterface;
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${certificationId}...`
  );
  try {
    if (certificationId) {
      exportData = await exportCertificationTemplate(certificationId, options);
      if (!file) {
        file = getTypedFilename(certificationId, 'certification');
      }
    } else {
      exportData = await exportCertificationTemplateByName(certificationName, options);
      if (!file) {
        file = getTypedFilename(certificationName, 'certification');
      }
    }

    const filePath = getFilePath(file, true);
    updateProgressIndicator(
      indicatorId,
      `Saving ${name} to ${filePath}...`
    );
    saveJsonToFile(exportData, filePath, includeMeta, false, keepModifiedProperties);
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
    includeEventTemplates: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportCertificationTemplates(options, errorHandler);
    if (!file) {
      file = getTypedFilename(`allCertifications`, 'certification');
    }
    saveJsonToFile(exportData, getFilePath(file, true), includeMeta, false, keepModifiedProperties);
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
    includeEventTemplates: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportCertificationTemplates(options, errorHandler);
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
 * @param {string} file import file name
 * @param {CertificationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importCertificationFromFile(){
//   certificationId: string,
//   file: string,
//   options: CertificationImportOptions = {
//     deps: true,
//   }
// ): Promise<boolean> {
//   let indicatorId: string;
//   try {
//     indicatorId = createProgressIndicator(
//       'indeterminate',
//       0,
//       'Importing certification...'
//     );
//     const importData = getCertificationExportFromFile(getFilePath(file));
//     updateProgressIndicator(indicatorId, 'Importing certification...');
//     await importCertifications(certificationId, importData, options);
//     stopProgressIndicator(
//       indicatorId,
//       `Successfully imported certification ${certificationId}.`,
//       'success'
//     );
//     return true;
//   } catch (error) {
//     stopProgressIndicator(
//       indicatorId,
//       `Error importing certification ${certificationId}`,
//       'fail'
//     );
//     printError(error);
//   }
  return false;
}

/**
 * Import certifications from file
 * @param {String} file file name
 * @param {CertificationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importCertificationsFromFile(){
//   file: string,
//   options: CertificationImportOptions = {
//     deps: true,
//   }
// ): Promise<boolean> {
//   let indicatorId: string;
//   try {
//     indicatorId = createProgressIndicator(
//       'indeterminate',
//       0,
//       'Importing certifications...'
//     );
//     const importData = getCertificationExportFromFile(getFilePath(file));
//     updateProgressIndicator(indicatorId, 'Importing certifications...');
//     await importCertifications(undefined, importData, options, errorHandler);
//     stopProgressIndicator(
//       indicatorId,
//       `Successfully imported certifications.`,
//       'success'
//     );
//     return true;
//   } catch (error) {
//     stopProgressIndicator(indicatorId, `Error importing certifications.`, 'fail');
//     printError(error, `Error importing certifications from file`);
//   }
  return false;
}

/**
 * Import all certifications from separate files
 * @param {CertificationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importCertificationsFromFiles(){
//   options: CertificationImportOptions = {
//     deps: true,
//   }
// ): Promise<boolean> {
//   let indicatorId: string;
//   const errors: Error[] = [];
//   try {
//     const names = fs.readdirSync(getWorkingDirectory());
//     const certificationFiles = names.filter((name) =>
//       name.toLowerCase().endsWith('.certification.json')
//     );
//     indicatorId = createProgressIndicator(
//       'determinate',
//       certificationFiles.length,
//       'Importing certifications...'
//     );
//     for (const file of certificationFiles) {
//       try {
//         updateProgressIndicator(
//           indicatorId,
//           `Importing certifications from file ${file}...`
//         );
//         await importCertificationsFromFile(file, options);
//       } catch (error) {
//         errors.push(
//           new FrodoError(`Error importing certifications from ${file}`, error)
//         );
//       }
//     }
//     if (errors.length > 0) {
//       throw new FrodoError(`One or more errors importing certifications`, errors);
//     }
//     stopProgressIndicator(
//       indicatorId,
//       `Successfully imported certifications.`,
//       'success'
//     );
//     return true;
//   } catch (error) {
//     stopProgressIndicator(indicatorId, `Error(s) importing certifications.`, 'fail');
//     printError(error, `Error importing certifications from files`);
//   }
  return false;
}

/**
 * Import first certification from file
 * @param {string} file import file name
 * @param {CertificationImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstCertificationFromFile(){
//   file: string,
//   options: CertificationImportOptions = {
//     deps: true,
//   }
// ): Promise<boolean> {
//   let indicatorId: string;
//   try {
//     indicatorId = createProgressIndicator(
//       'indeterminate',
//       0,
//       'Importing certification...'
//     );
//     const importData = getCertificationExportFromFile(getFilePath(file));
//     const ids = Object.keys(importData.certification);
//     if (ids.length === 0)
//       throw new FrodoError(`No certifications found in import data`);
//     await importCertifications(ids[0], importData, options);
//     stopProgressIndicator(
//       indicatorId,
//       `Imported certification from ${file}`,
//       'success'
//     );
//     return true;
//   } catch (error) {
//     stopProgressIndicator(
//       indicatorId,
//       `Error importing certification from ${file}`,
//       'fail'
//     );
//     printError(error);
//   }
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
  certificationName: string,
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
    includeEventTemplates: true,
  }
) : Promise<boolean> {
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
  // for (const certificationGroup of Object.values(exportData.certification)) {
  //   for (const certification of [
  //     certificationGroup.draft,
  //     certificationGroup.published,
  //   ].filter((w) => w)) {
  //     for (const step of certification.steps) {
  //       switch (step.type) {
  //         case 'approvalTask':
  //         case 'fulfillmentTask':
  //         case 'violationTask': {
  //           const actors = (step[step.type] as ApprovalTask)?.actors;
  //           if (
  //             !actors ||
  //             Array.isArray(actors) ||
  //             !actors.isExpression ||
  //             !isScriptExtracted(actors.value)
  //           )
  //             continue;
  //           const scriptRaw = getExtractedData(
  //             actors.value as string,
  //             file.substring(0, file.lastIndexOf('/'))
  //           );
  //           actors.value = scriptRaw;
  //           const uiConfigActors =
  //             certification.staticNodes?.uiConfig?.[step.name]?.actors;
  //           if (
  //             !uiConfigActors ||
  //             Array.isArray(uiConfigActors) ||
  //             !uiConfigActors.isExpression ||
  //             !isScriptExtracted(uiConfigActors.value)
  //           )
  //             continue;
  //           uiConfigActors.value = scriptRaw;
  //           continue;
  //         }
  //         case 'scriptTask': {
  //           const scriptTask = step[step.type] as ScriptTask;
  //           if (
  //             !step.name.startsWith('scriptTask') ||
  //             !isScriptExtracted(scriptTask.script)
  //           )
  //             continue;
  //           const scriptRaw = getExtractedData(
  //             scriptTask.script as string,
  //             file.substring(0, file.lastIndexOf('/'))
  //           );
  //           scriptTask.script = scriptRaw;
  //           continue;
  //         }
  //         default:
  //           continue;
  //       }
  //     }
  //   }
  // }
  return exportData;
}