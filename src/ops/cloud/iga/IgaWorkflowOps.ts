import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import {
  ApprovalTask,
  ScriptTask,
  WorkflowExpression,
} from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaWorkflowApi';
import {
  WorkflowExportInterface,
  WorkflowExportOptions,
  WorkflowGroup,
  WorkflowImportOptions,
} from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaWorkflowOps';
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
  importWorkflows,
  readWorkflowGroups,
  exportWorkflow,
  exportWorkflows,
  deleteDraftWorkflow,
  deletePublishedWorkflow,
  deleteWorkflows: _deleteWorkflows,
} = frodo.cloud.iga.workflow;
/**
 * List all the workflows
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listWorkflows(long: boolean = false): Promise<boolean> {
  let workflows: WorkflowGroup[] = [];
  try {
    workflows = await readWorkflowGroups();
    if (!long) {
      for (const workflow of workflows) {
        printMessage(
          `${workflow.published ? workflow.published.id : workflow.draft.id}`,
          'data'
        );
      }
      return true;
    }
    const table = createTable([
      'ID',
      'Name',
      'Drafted',
      'Published',
      'Mutable',
    ]);
    for (const workflowGroup of workflows) {
      const workflow = workflowGroup.published ?? workflowGroup.draft;
      table.push([
        `${workflow.id}`,
        workflow.name,
        workflowGroup.draft ? 'true'['brightGreen'] : 'false'['brightRed'],
        workflowGroup.published ? 'true'['brightGreen'] : 'false'['brightRed'],
        workflow.mutable ? 'true'['brightGreen'] : 'false'['brightRed'],
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
 * Describe a workflow
 * @param {string} workflowId workflow id
 * @param {string} file the workflow export file
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function describeWorkflow(
  workflowId?: string,
  file?: string
): Promise<boolean> {
  try {
    const workflowExport = file
      ? getWorkflowExportFromFile(getFilePath(file))
      : await exportWorkflow(workflowId, {
          deps: true,
          useStringArrays: false,
          coords: true,
          includeReadOnly: true,
        });
    if (!workflowId) {
      const ids = Object.keys(workflowExport.workflow);
      if (ids.length === 0)
        throw new FrodoError(`No workflows found in export file ${file}`);
      workflowId = ids[0];
    }
    // Workflow Details
    for (const workflow of [
      workflowExport.workflow[workflowId].draft,
      workflowExport.workflow[workflowId].published,
    ].filter((w) => w)) {
      const table = createKeyValueTable();
      table.push(['Id'['brightCyan'], workflow.id]);
      table.push(['Name'['brightCyan'], workflow.name]);
      table.push(['Display Name'['brightCyan'], workflow.displayName]);
      table.push(['Description'['brightCyan'], workflow.description]);
      if (workflow.type) table.push(['Type'['brightCyan'], workflow.type]);
      table.push(['Status'['brightCyan'], workflow.status]);
      table.push([
        'Mutable'['brightCyan'],
        workflow.mutable ? 'true'['brightGreen'] : 'false'['brightRed'],
      ]);
      table.push([
        'ChildType'['brightCyan'],
        workflow.childType ? 'true'['brightGreen'] : 'false'['brightRed'],
      ]);
      getTableRowsFromArray(
        table,
        `Steps (${workflow.steps.length})`,
        workflow.steps.map((s) => s.name)
      );
      printMessage(table.toString(), 'data');
    }
    // Email Templates
    if (Object.entries(workflowExport.emailTemplate).length) {
      printMessage(
        `\nEmail Templates (${
          Object.entries(workflowExport.emailTemplate).length
        }):`,
        'data'
      );
      for (const templateData of Object.values(workflowExport.emailTemplate)) {
        printMessage(
          `- ${EmailTemplate.getOneLineDescription(templateData)}`,
          'data'
        );
      }
    }
    // Events
    if (Object.entries(workflowExport.event).length) {
      printMessage(
        `\nEvents (${Object.entries(workflowExport.event).length}):`,
        'data'
      );
      for (const eventData of Object.values(workflowExport.event)) {
        printMessage(
          `- [${eventData.id['brightCyan']}] ${eventData.name}`,
          'data'
        );
      }
    }
    // Request Forms
    if (Object.entries(workflowExport.requestForm).length) {
      printMessage(
        `\nRequest Forms (${
          Object.entries(workflowExport.requestForm).length
        }):`,
        'data'
      );
      for (const formData of Object.values(workflowExport.requestForm)) {
        printMessage(
          `- [${formData.id['brightCyan']}] ${formData.name}`,
          'data'
        );
      }
    }
    // Request Types
    if (Object.entries(workflowExport.requestType).length) {
      printMessage(
        `\nRequest Types (${
          Object.entries(workflowExport.requestType).length
        }):`,
        'data'
      );
      for (const typeData of Object.values(workflowExport.requestType)) {
        printMessage(
          `- [${typeData.id['brightCyan']}] ${typeData.displayName}`,
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
 * Export workflow to file
 * @param {string} workflowId workflow id
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract extracts the scripts from the export into separate files if true. Default: false
 * @param {WorkflowExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportWorkflowToFile(
  workflowId: string,
  file: string,
  includeMeta: boolean = true,
  extract: boolean = false,
  options: WorkflowExportOptions = {
    deps: true,
    useStringArrays: true,
    coords: true,
    includeReadOnly: false,
  }
): Promise<boolean> {
  const indicatorId = createProgressIndicator(
    'determinate',
    1,
    `Exporting ${workflowId}...`
  );
  try {
    const exportData = await exportWorkflow(workflowId, options, errorHandler);
    if (!file) {
      file = getTypedFilename(workflowId, 'workflow');
    }
    const filePath = getFilePath(file, true);
    if (extract) extractWorkflowScriptsToFiles(exportData);
    updateProgressIndicator(
      indicatorId,
      `Saving ${workflowId} to ${filePath}...`
    );
    saveJsonToFile(exportData, filePath, includeMeta);
    stopProgressIndicator(
      indicatorId,
      `Exported workflow ${workflowId} to file`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error exporting workflow ${workflowId} to file`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Export all workflows to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {WorkflowExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportWorkflowsToFile(
  file: string,
  includeMeta: boolean = true,
  options: WorkflowExportOptions = {
    deps: true,
    useStringArrays: true,
    coords: true,
    includeReadOnly: false,
  }
): Promise<boolean> {
  try {
    const exportData = await exportWorkflows(options, errorHandler);
    if (!file) {
      file = getTypedFilename(`allWorkflows`, 'workflow');
    }
    saveJsonToFile(exportData, getFilePath(file, true), includeMeta);
    return true;
  } catch (error) {
    printError(error, `Error exporting workflows to file`);
  }
  return false;
}

/**
 * Export all workflows to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract extracts the scripts from the exports into separate files if true. Default: false
 * @param {WorkflowExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportWorkflowsToFiles(
  includeMeta: boolean = true,
  extract: boolean = false,
  options: WorkflowExportOptions = {
    deps: true,
    useStringArrays: true,
    coords: true,
    includeReadOnly: false,
  }
): Promise<boolean> {
  try {
    const exportData = await exportWorkflows(options);
    if (extract) extractWorkflowScriptsToFiles(exportData);
    for (const [workflowId, workflowGroup] of Object.entries(
      exportData.workflow
    )) {
      saveToFile(
        'workflow',
        workflowGroup,
        'id',
        getFilePath(getTypedFilename(workflowId, 'workflow'), true),
        includeMeta
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting workflows to files`);
  }
  return false;
}

/**
 * Import a workflow from file
 * @param {string} workflowId workflow id
 * @param {string} file import file name
 * @param {WorkflowImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importWorkflowFromFile(
  workflowId: string,
  file: string,
  options: WorkflowImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing workflow...'
    );
    const importData = getWorkflowExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing workflow...');
    await importWorkflows(workflowId, importData, options, errorHandler);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported workflow ${workflowId}.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing workflow ${workflowId}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Import workflows from file
 * @param {String} file file name
 * @param {WorkflowImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importWorkflowsFromFile(
  file: string,
  options: WorkflowImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing workflows...'
    );
    const importData = getWorkflowExportFromFile(getFilePath(file));
    updateProgressIndicator(indicatorId, 'Importing workflows...');
    await importWorkflows(undefined, importData, options, errorHandler);
    stopProgressIndicator(
      indicatorId,
      `Successfully imported workflows.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing workflows.`, 'fail');
    printError(error, `Error importing workflows from file`);
  }
  return false;
}

/**
 * Import all workflows from separate files
 * @param {WorkflowImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importWorkflowsFromFiles(
  options: WorkflowImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  const errors: Error[] = [];
  try {
    const names = fs.readdirSync(getWorkingDirectory());
    const workflowFiles = names.filter((name) =>
      name.toLowerCase().endsWith('.workflow.json')
    );
    indicatorId = createProgressIndicator(
      'determinate',
      workflowFiles.length,
      'Importing workflows...'
    );
    for (const file of workflowFiles) {
      try {
        updateProgressIndicator(
          indicatorId,
          `Importing workflows from file ${file}...`
        );
        await importWorkflowsFromFile(file, options);
      } catch (error) {
        errors.push(
          new FrodoError(`Error importing workflows from ${file}`, error)
        );
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`One or more errors importing workflows`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `Successfully imported workflows.`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error(s) importing workflows.`, 'fail');
    printError(error, `Error importing workflows from files`);
  }
  return false;
}

/**
 * Import first workflow from file
 * @param {string} file import file name
 * @param {WorkflowImportOptions} options import options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function importFirstWorkflowFromFile(
  file: string,
  options: WorkflowImportOptions = {
    deps: true,
  }
): Promise<boolean> {
  let indicatorId: string;
  try {
    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing workflow...'
    );
    const importData = getWorkflowExportFromFile(getFilePath(file));
    const ids = Object.keys(importData.workflow);
    if (ids.length === 0)
      throw new FrodoError(`No workflows found in import data`);
    await importWorkflows(ids[0], importData, options, errorHandler);
    stopProgressIndicator(
      indicatorId,
      `Imported workflow from ${file}`,
      'success'
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing workflow from ${file}`,
      'fail'
    );
    printError(error);
  }
  return false;
}

/**
 * Delete workflow. If both deleteDraft and deletePublished are truthy or falsy, attempt to delete both, otherwise deletes only one of them.
 * @param {string} workflowId workflow id
 * @param {boolean} deleteDraft true to delete only the draft workflow, false otherwise
 * @param {boolean} deletePublished true to delete only the draft workflow, false otherwise
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteWorkflow(
  workflowId: string,
  deleteDraft?: boolean,
  deletePublished?: boolean
): Promise<boolean> {
  let isSuccess = true;
  // Attempt to delete draft first
  if (deleteDraft || !deletePublished) {
    const spinnerId = createProgressIndicator(
      'indeterminate',
      undefined,
      `Deleting draft workflow ${workflowId}...`
    );
    try {
      await deleteDraftWorkflow(workflowId);
      stopProgressIndicator(
        spinnerId,
        `Deleted draft workflow ${workflowId}.`,
        'success'
      );
    } catch (error) {
      stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
      printError(error);
      isSuccess = false;
    }
  }
  // Attempt to delete published second
  if (deletePublished || !deleteDraft) {
    const spinnerId = createProgressIndicator(
      'indeterminate',
      undefined,
      `Deleting published workflow ${workflowId}...`
    );
    try {
      await deletePublishedWorkflow(workflowId);
      stopProgressIndicator(
        spinnerId,
        `Deleted published workflow ${workflowId}.`,
        'success'
      );
    } catch (error) {
      stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
      printError(error);
      isSuccess = false;
    }
  }
  return isSuccess;
}

/**
 * Delete workflows
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function deleteWorkflows(): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    undefined,
    `Deleting workflows...`
  );
  try {
    await _deleteWorkflows(errorHandler);
    stopProgressIndicator(spinnerId, `Deleted workflows.`, 'success');
    return true;
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error: ${error.message}`, 'fail');
    printError(error);
  }
  return false;
}

/**
 * Get a workflow export from json file.
 *
 * @param file The path to the workflow export file
 * @returns The workflow export
 */
export function getWorkflowExportFromFile(
  file: string
): WorkflowExportInterface {
  const exportData = JSON.parse(
    fs.readFileSync(file, 'utf8')
  ) as WorkflowExportInterface;
  for (const workflowGroup of Object.values(exportData.workflow)) {
    for (const workflow of [
      workflowGroup.draft,
      workflowGroup.published,
    ].filter((w) => w)) {
      for (const step of workflow.steps) {
        switch (step.type) {
          case 'approvalTask':
          case 'fulfillmentTask':
          case 'violationTask': {
            const actors = (step[step.type] as ApprovalTask).actors;
            if (
              !actors ||
              Array.isArray(actors) ||
              !actors.isExpression ||
              !isScriptExtracted(actors.value)
            )
              continue;
            const scriptRaw = getExtractedData(
              actors.value as string,
              file.substring(0, file.lastIndexOf('/'))
            );
            actors.value = scriptRaw;
            continue;
          }
          case 'scriptTask': {
            const scriptTask = step[step.type] as ScriptTask;
            if (
              !step.name.startsWith('scriptTask') ||
              !isScriptExtracted(scriptTask.script)
            )
              continue;
            const scriptRaw = getExtractedData(
              scriptTask.script as string,
              file.substring(0, file.lastIndexOf('/'))
            );
            scriptTask.script = scriptRaw;
            continue;
          }
          default:
            continue;
        }
      }
    }
  }
  return exportData;
}

/**
 * Extracts scripts from a workflow export into separate files.
 * @param {WorkflowExportInterface} exportData The workflow export
 * @param {string} workflowId The workflow id to extract a specific script from. If undefined, will extract scripts from all workflows.
 * @param {string} directory The directory within the base directory to save the script files
 * @returns {boolean} true if successful, false otherwise
 */
export function extractWorkflowScriptsToFiles(
  exportData: WorkflowExportInterface,
  workflowId?: string,
  directory?: string
): boolean {
  try {
    const workflows = workflowId
      ? [exportData.workflow[workflowId]]
      : Object.values(exportData.workflow);
    for (const workflowGroup of workflows) {
      for (const workflow of [
        workflowGroup.draft,
        workflowGroup.published,
      ].filter((w) => w)) {
        const workflowDirectory = `${directory ? directory + '/' : ''}${workflow.id}/${workflow.status}`;
        for (const step of workflow.steps) {
          switch (step.type) {
            case 'approvalTask':
            case 'fulfillmentTask':
            case 'violationTask': {
              const actors = (step[step.type] as ApprovalTask).actors;
              if (!actors || Array.isArray(actors) || !actors.isExpression)
                continue;
              const scriptText = Array.isArray(actors.value)
                ? actors.value.join('\n')
                : actors.value;
              const scriptFileName = getTypedFilename(
                step.name,
                'workflow',
                'js'
              );
              (
                (step[step.type] as ApprovalTask).actors as WorkflowExpression
              ).value = extractDataToFile(
                scriptText,
                scriptFileName,
                workflowDirectory
              );
              continue;
            }
            case 'scriptTask': {
              if (!step.name.startsWith('scriptTask')) continue;
              const script = (step[step.type] as ScriptTask).script;
              const scriptText = Array.isArray(script)
                ? script.join('\n')
                : script;
              const scriptFileName = getTypedFilename(
                step.name,
                'workflow',
                (step[step.type] as ScriptTask).language === 'javascript'
                  ? 'js'
                  : 'unknown'
              );
              (step[step.type] as ScriptTask).script = extractDataToFile(
                scriptText,
                scriptFileName,
                workflowDirectory
              );
              continue;
            }
            default:
              continue;
          }
        }
      }
    }
    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
