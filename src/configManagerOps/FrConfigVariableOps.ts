import { frodo } from '@rockcarver/frodo-lib';
import { VariableSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/VariablesApi';
import { VariablesExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/VariablesOps';
import fs from 'fs';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';
import { escapePlaceholders, esvToEnv } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readVariables, importVariable } = frodo.cloud.variable;

/**
 * Export all variables to seperate files
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportVariables(): Promise<boolean> {
  let spinnerId: string;
  let indicatorId: string;
  let variableList: VariableSkeleton[] = [];
  try {
    spinnerId = createProgressIndicator(
      'indeterminate',
      0,
      `Retrieving variables...`
    );
    variableList = await readVariables();
    stopProgressIndicator(
      spinnerId,
      `Successfully retrieved ${variableList.length} variables`,
      'success'
    );
  } catch (error) {
    stopProgressIndicator(spinnerId, `Error retrieving variables`, 'fail');
    printError(error);
    return false;
  }
  try {
    const indicatorId = createProgressIndicator(
      'determinate',
      variableList.length,
      'Exporting variables'
    );
    for (const variable of variableList) {
      const envVariable = esvToEnv(variable._id);

      const variableObject = {
        _id: variable._id,
        expressionType: variable.expressionType,
        description: escapePlaceholders(variable.description),
        valueBase64: '${' + envVariable + '}',
      };

      saveJsonToFile(
        variableObject,
        getFilePath(`esvs/variables/${variable._id}.json`, true),
        false
      );
      updateProgressIndicator(indicatorId, `Writing variable ${variable._id}`);
    }
    stopProgressIndicator(
      indicatorId,
      `${variableList.length} variables exported`
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error exporting variables`);
    printError(error);
  }
  return false;
}

/**
 * Import variables to tenant
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerImportVariables(): Promise<boolean> {
  try {
    const variablesDir = getFilePath('esvs/variables');
    const variablesFiles = fs.readdirSync(variablesDir);

    for (const variablesFile of variablesFiles) {
      const filePath = `${variablesDir}/${variablesFile}`;
      const readFile = fs.readFileSync(filePath, 'utf-8');
      const importData = JSON.parse(readFile);

      if (importData.valueBase64) {
        importData.valueBase64 = Buffer.from(importData.valueBase64).toString(
          'base64'
        );
      }

      const singleVariableImport: VariablesExportInterface = {
        variable: { [importData._id]: importData },
      };
      await importVariable(importData._id, singleVariableImport);
    }

    return true;
  } catch (error) {
    printError(error);
  }
  return false;
}
