import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';
import path from 'path';

import { extractFrConfigDataToFile } from '../utils/Config';
import { printError, verboseMessage } from '../utils/Console';
import { safeFileName } from '../utils/FrConfig';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { readWorkflows, importWorkflows } = frodo.cloud.iga.workflow;

/**
 * Export IGA workflows in fr-config-manager format.
 * @param {string} name optional workflow name to filter by
 * @param {boolean} includeImmutable if true, also export immutable workflows
 * @returns {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerExportIgaWorkflows(
  name?: string,
  includeImmutable: boolean = false
): Promise<boolean> {
  try {
    let workflows = await readWorkflows();
    if (name) {
      workflows = workflows.filter((workflow) => workflow.name === name);
    }
    if (!includeImmutable) {
      workflows = workflows.filter((workflow) => workflow.mutable);
    }
    workflows.forEach((workflow) => {
      processIgaWorkflow(workflow, 'iga/workflows');
    });
    return true;
  } catch (error) {
    printError(error, 'Error exporting iga-workflows to files');
  }
  return false;
}

async function processIgaWorkflow(workflow, fileDir) {
  try {
    const workflowName = safeFileName(workflow.name);
    const workflowPath = `${fileDir}/${workflowName}`;
    if (Array.isArray(workflow.steps)) {
      const stepsPath = `${workflowPath}/steps`;
      workflow.steps.forEach((step) => {
        const uniqueId = safeFileName(`${step.displayName} - ${step.name}`);
        const stepPath = `${stepsPath}/${uniqueId}`;
        const stepBody = step[step.type];
        if (
          stepBody &&
          typeof stepBody === 'object' &&
          typeof stepBody.script === 'string' &&
          stepBody.script.length > 0
        ) {
          const scriptFilename = `${uniqueId}.js`;
          extractFrConfigDataToFile(stepBody.script, scriptFilename, stepPath);
          stepBody.script = {
            file: scriptFilename,
          };
        }
        const stepFileName = `${stepPath}/${uniqueId}.json`;
        saveJsonToFile(step, getFilePath(stepFileName, true), false, true);
      });
      delete workflow.steps;
    }
    const fileName = `${workflowPath}/${workflowName}.json`;
    saveJsonToFile(workflow, getFilePath(fileName, true), false, true);
  } catch (err) {
    printError(err);
  }
}

/**
 * Import IGA workflows in fr-config-manager format.
 * @param {string} name optional workflow name to filter by
 * @param {boolean} draft if true, will import workflow as draft
 * @returns {Promise<boolean>} a promise that resolves to true if successful, false otherwise
 */
export async function configManagerImportIgaWorkflows(
  name?: string,
  draft: boolean = false
): Promise<boolean> {
  try {
    const workflowsPath = getFilePath('iga/workflows');
    let workflowDirs = [];

    if (name) {
      const workflowName = `${workflowsPath}/${name}`;
      workflowDirs = [workflowName];
    } else {
      workflowDirs = fs
        .readdirSync(workflowsPath)
        .map((dirName) => `${workflowsPath}/${dirName}`);
    }

    for (const workflowDir of workflowDirs) {
      const workflow = processWorkflows(workflowDir);
      if (!workflow.mutable) {
        verboseMessage(`Skipping immutable workflow ${workflow.name}`);
        continue;
      }
      const status = draft ? 'draft' : 'published';
      workflow.status = status;
      const importData = {
        workflow: { [workflow.id]: { [status]: workflow } },
      } as any;
      await importWorkflows(workflow.id, importData);
    }
    return true;
  } catch (error) {
    printError(error, 'Error importing iga-workflows to files');
  }
  return false;
}

function processWorkflows(workflowDir: string) {
  try {
    const workflowName = path.parse(workflowDir).base;
    const workflowFile = path.join(workflowDir, `${workflowName}.json`);
    const workflow = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));

    const stepsDir = path.join(workflowDir, 'steps');
    const steps = [];
    if (fs.existsSync(stepsDir)) {
      const stepDirs = fs
        .readdirSync(stepsDir, { withFileTypes: true })
        .map((dirent) => path.join(stepsDir, dirent.name));

      for (const stepDir of stepDirs) {
        const stepName = path.parse(stepDir).base;
        const stepFile = path.join(stepDir, `${stepName}.json`);
        const step = JSON.parse(fs.readFileSync(stepFile, 'utf8'));
        const stepBody = step?.[step?.type];
        if (
          stepBody &&
          typeof stepBody === 'object' &&
          stepBody.script &&
          typeof stepBody.script === 'object' &&
          typeof stepBody.script.file === 'string'
        ) {
          const filePath = path.join(stepDir, stepBody.script.file);
          if (fs.existsSync(filePath)) {
            stepBody.script = fs.readFileSync(filePath, 'utf8');
          }
        }
        steps.push(step);
      }
      workflow.steps = steps;
    }
    return workflow;
  } catch (error) {
    printError(error, 'Error importing iga-workflows to files');
  }
}
