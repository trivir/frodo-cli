import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import {
  assignRequestForm,
  CustomFormField,
  Field,
  FieldRow,
  FieldType,
  getRequestFormAssignments,
  RequestFormEvent,
  RequestFormOperationType,
  RequestFormType,
  SelectFieldObjectType,
} from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaRequestFormApi';
import {
  RequestForm,
  RequestFormExportInterface,
  RequestFormExportOptions,
  RequestFormImportOptions,
} from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaRequestFormOps';
import { underline } from 'colors';
import fs from 'fs';

import { extractDataToFile, getExtractedData } from '../../../utils/Config';
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
import { isScriptExtracted } from '../../ScriptOps';
import { errorHandler } from '../../utils/OpsUtils';

const {
  getTypedFilename,
  saveToFile,
  saveJsonToFile,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const {
  exportRequestForms,
  exportRequestForm,
  exportRequestFormByName,
  readRequestForms,
  importRequestForms,
  deleteRequestForms,
  deleteRequestFormByName,
} = frodo.cloud.iga.requestForm;
/**
 * List all the request forms
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listRequestForms(
  long: boolean = false
): Promise<boolean> {
  try {
    const requestForms = await readRequestForms();
    if (!long) {
      for (const requestForm of requestForms) {
        printMessage(`${requestForm.name}`, 'data');
      }
      return true;
    }
    const table = createTable([
      'ID',
      'Name',
      'Type',
      'Description',
      'Operation',
    ]);
    for (const requestForm of requestForms) {
      table.push([
        `${requestForm.id}`,
        requestForm.name,
        requestForm.type,
        requestForm.description ?? '',
        requestForm.categories?.operation ?? '',
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
 * @param {string} formName the request form name
 * @param {string} file optional file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeRequestForm(
  formName?: string,
  file?: string
): Promise<boolean> {
  try {
    const requestFormExport: RequestFormExportInterface = file
      ? (JSON.parse(
          fs.readFileSync(getFilePath(file), 'utf8')
        ) as RequestFormExportInterface)
      : await exportRequestFormByName(formName);

    let form;
    if (formName) {
      form = Object.values(requestFormExport.requestForm).find(
        (f) => f.name === formName
      );
      if (!form) {
        throw new FrodoError(
          `Request form '${formName}' not found in export${file ? ` file ${file}` : ''}`
        );
      }
    } else {
      const forms = Object.values(requestFormExport.requestForm);
      if (forms.length === 0) {
        throw new FrodoError(`No request forms found in export file ${file}`);
      }
      form = forms[0];
    }

    // Form Details
    printMessage('Request Form', 'data');
    const table = createKeyValueTable();
    table.push(['Id'['brightCyan'], form.id]);
    table.push(['Name'['brightCyan'], form.name]);
    table.push(['Type'['brightCyan'], form.type]);
    table.push(['Description'['brightCyan'], form.description ?? '']);
    table.push(['Operation'['brightCyan'], form.categories?.operation ?? '']);
    if (form.categories?.applicationType) {
      table.push([
        'Application Type'['brightCyan'],
        form.categories.applicationType,
      ]);
    }
    if (form.categories?.objectType) {
      table.push(['Object Type'['brightCyan'], form.categories.objectType]);
    }
    if (form.categories?.lcmType) {
      table.push(['LCM Type'['brightCyan'], form.categories.lcmType]);
    }
    if (form.categories?.requestType) {
      table.push(['Request Type'['brightCyan'], form.categories.requestType]);
    }
    if (form._rev !== undefined) {
      table.push(['Revision'['brightCyan'], `${form._rev}`]);
    }
    if (form.metadata?.createdDate) {
      table.push(['Created'['brightCyan'], form.metadata.createdDate]);
    }
    if (form.metadata?.modifiedDate) {
      table.push(['Modified'['brightCyan'], form.metadata.modifiedDate]);
    }
    printMessage(table.toString() + '\n', 'data');

    // Form Structure (sections and input fields)
    const sections = form.form?.fields ?? [];
    if (sections.length) {
      printMessage(`Form Structure (${sections.length} section(s)):`, 'data');
      for (const section of sections) {
        const inputs = section.fields ?? [];
        printMessage(
          `- Section [${section.id['brightCyan']}] (${inputs.length} field(s))`,
          'data'
        );
        for (const input of inputs) {
          const required = (input as CustomFormField).validation?.required
            ? ' *'['brightRed']
            : '';
          const label = (input as CustomFormField).label ?? '(no label)';
          const model = (input as CustomFormField).model ?? '';
          printMessage(
            `    - [${input.type}] ${label}${required}${model ? ` → ${model}` : ''}`,
            'data'
          );
        }
      }
      printMessage('', 'data');
    }

    // Assignments
    if (form.assignments && form.assignments.length) {
      printMessage(`Assignments (${form.assignments.length}):`, 'data');
      for (const assignment of form.assignments) {
        printMessage(`- ${assignment.objectId}`, 'data');
      }
      printMessage('', 'data');
    }

    // Request Type Dependencies
    if (
      requestFormExport.requestType &&
      Object.keys(requestFormExport.requestType).length
    ) {
      printMessage(
        `Request Types (${Object.keys(requestFormExport.requestType).length}):`,
        'data'
      );
      for (const typeData of Object.values(requestFormExport.requestType)) {
        printMessage(
          `- [${typeData.id['brightCyan']}] ${typeData.displayName ?? ''}`,
          'data'
        );
      }
    }

    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
/**
 * Export request form to file by ID
 * @param {string} formId request form id
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {boolean} extract true to extract scripts to separate files. Default: false
 * @param {RequestFormExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportRequestFormToFile(
  formId: string,
  formName: string,
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: RequestFormExportOptions = {
    deps: true,
    useStringArrays: true,
  }
): Promise<boolean> {
  const label = formName ?? formId;
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${label}...`
  );
  try {
    const exportData = formName
      ? await exportRequestFormByName(formName, options)
      : await exportRequestForm(formId, options);
    const actualId = Object.keys(exportData.requestForm)[0];
    if (!file) {
      const name = exportData.requestForm[actualId]?.name ?? actualId;
      file = getTypedFilename(name, 'requestForm');
    }
    if (extract) {
      extractRequestFormScriptsToFiles(exportData, actualId);
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
      `Exported request form ${formName} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting request form ${formName} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
} /**
 * Export all request forms to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {RequestFormExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportAllRequestFormsToFile(
  file: string,
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: RequestFormExportOptions = {
    deps: true,
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportRequestForms(options);
    if (!file) {
      file = getTypedFilename('allRequestForms', 'requestForm');
    }
    if (extract) {
      extractRequestFormScriptsToFiles(exportData);
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
    printError(error, `Error exporting request forms to file`);
  }
  return false;
}
/**
 * Export all request forms to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} keepModifiedProperties true to keep modified properties, otherwise delete them. Default: false
 * @param {RequestFormExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportAllRequestFormsToFiles(
  includeMeta: boolean = true,
  keepModifiedProperties: boolean = false,
  extract: boolean = false,
  options: RequestFormExportOptions = {
    deps: true,
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportRequestForms(options);
    for (const [formName, requestForm] of Object.entries(
      exportData.requestForm
    )) {
      if (extract) {
        extractRequestFormScriptsToFiles(exportData, formName);
      }
      saveToFile(
        'requestForm',
        requestForm,
        'id',
        getFilePath(
          getTypedFilename(requestForm.name ?? formName, 'requestForm'),
          true
        ),
        includeMeta,
        keepModifiedProperties
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting request forms to files`);
  }
  return false;
} /**
 * Import a request form from file
 * @param {string} formName request form name
 * @param {string} file import file name
 * @param {RequestFormImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importRequestFormFromFile(
  formName: string,
  file: string,
  options: RequestFormImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing request forms...'
    );
    const requestFormPath = getFilePath(file);
    const readRequestForm = fs.readFileSync(requestFormPath, 'utf8');
    const importData: RequestFormExportInterface = JSON.parse(readRequestForm);

    updateProgressIndicator(indicatorId, 'Importing request forms...');
    await importRequestForms(importData, undefined, formName, options);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported request forms ${formName}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing request form ${formName}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import request forms from file
 * @param {String} file file name
 * @param {RequestFormImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importRequestFormsFromFile(
  file: string
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing request forms...'
    );
    const readRequestForms = fs.readFileSync(file, 'utf8');
    const importData: RequestFormExportInterface = JSON.parse(readRequestForms);
    updateProgressIndicator(indicatorId, 'Importing request forms...');
    await importRequestForms(importData);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported request forms.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing request forms.`,
      'fail'
    );
    printError(error, `Error importing request forms from file`);
  }
  return false;
}

/**
 * Import all request forms from separate files
 * @param {RequestFormImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importRequestFormsFromFiles(): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const requestFormsFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.requestforms.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      requestFormsFiles.length,
      'Importing request forms...'
    );
    for (const file of requestFormsFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing request form from file ${file}...`
        );
        const readFile = fs.readFileSync(file, 'utf8');
        const importData: RequestFormExportInterface = JSON.parse(readFile);
        await importRequestForms(importData, undefined);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing request form from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`One or more errors importing request form`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported request form.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error(s) importing request form.`,
      'fail'
    );
    printError(error, `Error importing request form from files`);
  }
  return false;
}

/**
 * Import first request form from file
 * @param {string} file import file name
 * @param {RequestFormImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstRequestFormFromFile(
  file: string,
  options: RequestFormImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing request forms...'
    );
    const readRequestForm = fs.readFileSync(getFilePath(file), 'utf8');
    const importData: RequestFormExportInterface = JSON.parse(readRequestForm);
    const formId = Object.keys(importData.requestForm);
    if (formId.length === 0)
      throw new FrodoError(`No request form found in import data`);
    await importRequestForms(importData, formId[0], undefined, options);
    stopProgressIndicator(
      indicatorId,
      `Imported request form from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing request form from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete request form.
 * @param {string} formName request form name

 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteRequestForm(formName: string): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting workflow ${formName}...`
  );
  try {
    const result = await deleteRequestFormByName(formName);

    stopProgressIndicator(
      spinnerId,
      `Deleted workflow ${formName}.`,
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
 * Delete request forms.
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteAllRequestForms(): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting workflows...`
  );
  try {
    await deleteRequestForms();
    stopProgressIndicator(spinnerId, `Deleted workflows.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Extracts scripts from a request form export into separate files.
 * @param {RequestFormExportInterface} exportData The request form export
 * @param {string} formId The request form id to extract scripts from. If undefined, will extract scripts from all request forms.
 * @param {string} directory The directory within the base directory to save the script files
 * @returns {boolean} true if successful, false otherwise
 */
export function extractRequestFormScriptsToFiles(
  exportData: RequestFormExportInterface,
  formName?: string,
  directory?: string
): boolean {
  try {
    const forms = formName
      ? [exportData.requestForm[formName]]
      : Object.values(exportData.requestForm);
    for (const form of forms) {
      if (!form) continue;
      const formDirectory = `${directory ? directory + '/' : ''}${form.name}`;
      // onLoad event script
      const onLoad = form.form?.events?.onLoad;
      if (onLoad?.script) {
        const scriptText = Array.isArray(onLoad.script)
          ? onLoad.script.join('\n')
          : onLoad.script;
        const scriptFileName = getTypedFilename('onLoad', 'requestForm', 'js');
        onLoad.script = extractDataToFile(
          scriptText,
          `${formDirectory}/${scriptFileName}`
        );
      }
      // onChangeEvent scripts on each input field
      const sections = form.form?.fields ?? [];
      for (const section of sections) {
        const inputs = section.fields ?? [];
        for (const input of inputs) {
          const customField = input as CustomFormField;
          const onChange = customField.onChangeEvent;
          if (!onChange?.script) continue;
          const scriptText = Array.isArray(onChange.script)
            ? onChange.script.join('\n')
            : onChange.script;
          const fieldId = customField.model ?? customField.id;
          const scriptFileName = getTypedFilename(
            `${fieldId}.onChange`,
            'requestForm',
            'js'
          );
          onChange.script = extractDataToFile(
            scriptText,
            `${formDirectory}/${scriptFileName}`
          );
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
