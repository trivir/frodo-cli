import { frodo } from '@rockcarver/frodo-lib';
import { errorHandler } from '../../utils/OpsUtils';

import {
  createProgressIndicator,
  createTable,
  debugMessage,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../../../utils/Console';
import { WorkflowExportInterface, WorkflowExportOptions, WorkflowGroup } from '@rockcarver/frodo-lib/types/ops/cloud/iga/IgaWorkflowOps';
import { ApprovalTask, ScriptTask, WorkflowExpression } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaWorkflowApi';
import { extractDataToFile } from '../../../utils/Config';
const {
  getTypedFilename,
  saveJsonToFile,
  getRealmString,
  getFilePath,
  getWorkingDirectory,
} = frodo.utils;
const {
  readWorkflows,
  readDraftWorkflow,
  readPublishedWorkflow,
  readWorkflowGroups,
  exportWorkflow,
  exportWorkflows,
  deleteDraftWorkflow,
  deletePublishedWorkflow,
  deleteWorkflows
} = frodo.cloud.iga.workflow;
/**
 * List all the workflows
 * @param {boolean} long Long version, all the fields
 * @returns {Promise<boolean>} a promise resolving to true if successful, false otherwise
 */
export async function listWorkflows(
  long: boolean = false,
): Promise<boolean> {
  let workflows: WorkflowGroup[] = [];
  try {
    workflows = await readWorkflowGroups();
    if (!long) {
      for (const workflow of workflows) {
        printMessage(`${workflow.published ? workflow.published.id : workflow.draft.id}`, 'data');
      }
      return true;
    }
    const table = createTable(['ID', 'Name', 'Drafted', 'Published', 'Mutable']);
    for (const workflowGroup of workflows) {
      const workflow = workflowGroup.published ?? workflowGroup.draft;
      table.push([
        `${workflow.id}`,
        workflow.name,
        workflowGroup.draft ? 'true'['brightGreen'] : 'false'['brightRed'],
        workflowGroup.published ? 'true'['brightGreen'] : 'false'['brightRed'],
        workflow.mutable ? 'true'['brightGreen'] : 'false'['brightRed']
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
    if (extract)
      extractCustomNodeScriptsToFiles(
        exportData,
        undefined,
        undefined,
        !!nodeName
      );
    updateProgressIndicator(indicatorId, `Saving ${workflowId} to ${filePath}...`);
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
 * Export all custom nodes to file
 * @param {string} file file name
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {CustomNodeExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportCustomNodesToFile(
  file: string,
  includeMeta: boolean = true,
  options: CustomNodeExportOptions = {
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportCustomNodes(options);
    if (!file) {
      file = getTypedFilename(`allCustomNodes`, 'nodeTypes');
    }
    saveJsonToFile(exportData, getFilePath(file, true), includeMeta);
    return true;
  } catch (error) {
    printError(error, `Error exporting custom nodes to file`);
  }
  return false;
}

/**
 * Export all custom nodes to separate files
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} extract extracts the scripts from the exports into separate files if true. Default: false
 * @param {CustomNodeExportOptions} options export options
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function exportCustomNodesToFiles(
  includeMeta: boolean = true,
  extract: boolean = false,
  options: CustomNodeExportOptions = {
    useStringArrays: true,
  }
): Promise<boolean> {
  try {
    const exportData = await exportCustomNodes(options);
    if (extract) extractCustomNodeScriptsToFiles(exportData);
    for (const customNode of Object.values(exportData.nodeTypes)) {
      saveToFile(
        'nodeTypes',
        customNode,
        '_id',
        getFilePath(
          getTypedFilename(customNode.displayName, 'nodeTypes'),
          true
        ),
        includeMeta
      );
    }
    return true;
  } catch (error) {
    printError(error, `Error exporting custom nodes to files`);
  }
  return false;
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
  directory?: string,
): boolean {
  try {
    const workflows = workflowId
      ? [exportData.workflow[workflowId]]
      : Object.values(exportData.workflow);
    for (const workflowGroup of workflows) {
      for (const workflow of [workflowGroup.draft, workflowGroup.published].filter(w => w)) {
        for (const step of workflow.steps) {
          switch (step.type) {
            case 'approvalTask':
            case 'fulfillmentTask':
            case 'violationTask':
              const actors = (step[step.type] as ApprovalTask).actors;
              if (!actors || Array.isArray(actors) || !actors.isExpression) continue;
              const actorScriptText = Array.isArray(actors.value) ? actors.value.join('\n') : actors.value;
              const actorFileName = getTypedFilename(
                step.name,
                'workflow',
                'js'
              );
              ((step[step.type] as ApprovalTask).actors as WorkflowExpression).value = extractDataToFile(actorScriptText, actorFileName, `${directory ? directory + '/' : ''}${workflow.id}/${workflow.status}`);
              continue;
            case 'scriptTask':
              if (!step.name.startsWith('scriptTask')) continue;
              const script = (step[step.type] as ScriptTask).script;
              const scriptText = Array.isArray(script) ? script.join('\n') : script;
              const scriptFileName = getTypedFilename(
                step.name,
                'workflow',
                (step[step.type] as ScriptTask).language === 'javascript' ? 'js' : 'unknown'
              );
              (step[step.type] as ScriptTask).script = extractDataToFile(scriptText, scriptFileName, `${directory ? directory + '/' : ''}${workflow.id}/${workflow.status}`);
              continue;
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