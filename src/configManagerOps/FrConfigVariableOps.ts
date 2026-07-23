import { frodo, FrodoError } from '@rockcarver/frodo-lib';
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

const { getFilePath, saveJsonToFile, readJsonFile } = frodo.utils;
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

export function resolvePlaceholder(
  placeholder: string,

  envFile: Record<string, string> = {}
): string {
  const match = placeholder.match(/^\$\{(BASE64:)?(.+)\}$/);

  if (!match) {
    throw new FrodoError(`Invalid placeholder format: ${placeholder}`);
  }

  const isBase64 = !!match[1];
  const name = match[2];
  let value: string;

  if (name in envFile) {
    value = envFile[name];
  } else if (name in process.env) {
    value = process.env[name];
  } else {
    throw new FrodoError(`No value found for ${name}`);
  }

  return isBase64 ? value : Buffer.from(value).toString('base64');
}

/**
 * Import variables to tenant
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerImportVariables(
  variableName?: string,
  env: string[] = [],
  envFile: string[] = []
): Promise<boolean> {
  const errors = [];
  let indicatorId: string;

  const envValues: Record<string, string> = {};

  for (const filePath of envFile) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      printError(new FrodoError(`Error reading env file ${filePath}`, error));
      return false;
    }
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex < 1) {
        printError(
          new FrodoError(
            `Invalid line in ${filePath}: ${trimmed}, expected key=value`
          )
        );
        return false;
      }
      envValues[trimmed.slice(0, separatorIndex)] = trimmed.slice(
        separatorIndex + 1
      );
    }
  }

  for (const pair of env) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex < 1) {
      printError(
        new FrodoError(`Invalid env format: ${pair}, expected key=value`)
      );
      return false;
    }
    envValues[pair.slice(0, separatorIndex)] = pair.slice(separatorIndex + 1);
  }

  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading variables...`
  );

  try {
    const variablesDir = getFilePath(`esvs/variables`);
    if (!fs.existsSync(variablesDir)) {
      stopProgressIndicator(spinnerId, `No variables found`, 'fail');
      return true;
    }

    const fileNames = fs
      .readdirSync(variablesDir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .filter((name) => !variableName || name === `${variableName}.json`);

    if (fileNames.length === 0) {
      stopProgressIndicator(
        spinnerId,
        variableName
          ? `No matching variable found for ${variableName}`
          : 'No variables found to import',
        'fail'
      );
      return true;
    }

    stopProgressIndicator(
      spinnerId,
      `Successfully read ${fileNames.length} variables.`,
      'success'
    );

    indicatorId = createProgressIndicator(
      'determinate',
      fileNames.length,
      'Importing variables'
    );

    for (const fileName of fileNames) {
      try {
        const importData = readJsonFile(`${variablesDir}/${fileName}`, {
          envFileValues: envValues,
          base64Encode: true,
        }) as VariableSkeleton;

        if (!importData.expressionType) {
          importData.expressionType = 'string';
        }

        const singleVariableImport: VariablesExportInterface = {
          variable: { [importData._id]: importData },
        };
        await importVariable(importData._id, singleVariableImport);
        updateProgressIndicator(
          indicatorId,
          `Imported variable ${importData._id}`
        );
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new FrodoError(`Error importing variables`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `${fileNames.length} variables imported.`
    );
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing variables`, 'fail');
    printError(error);
    return false;
  }
}
