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

export function loadEnvFile(): Record<string, string> {
  const envPath = getFilePath('.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const out: Record<string, string> = {};
  const contents = fs.readFileSync(envPath, 'utf8');

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const eq = line.indexOf('=');

    if (eq === -1) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) {
      out[key] = value;
    }
  }
  return out;
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
  value?: string
): Promise<boolean> {
  const errors = [];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading variables...`
  );
  let indicatorId: string;
  try {
    const variablesDir = getFilePath(`esvs/variables/`);
    if (!fs.existsSync(variablesDir)) {
      stopProgressIndicator(spinnerId, `No variables found`, 'fail');
      return true;
    }

    const files = fs
      .readdirSync(variablesDir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .map((name) =>
        JSON.parse(fs.readFileSync(`${variablesDir}/${name}`, 'utf8'))
      )
      .filter((data) => !variableName || data._id === variableName);

    if (files.length === 0) {
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
      `Successfully read ${files.length} variables.`,
      'success'
    );

    const envFile = loadEnvFile();

    indicatorId = createProgressIndicator(
      'determinate',
      files.length,
      'Importing variables'
    );

    for (const importData of files) {
      try {
        if (value) {
          importData.valueBase64 = Buffer.from(value).toString('base64');
        } else if (importData.valueBase64) {
          importData.valueBase64 = resolvePlaceholder(
            importData.valueBase64,
            envFile
          );
        } else {
          throw new FrodoError(
            `No value provided for variable ${importData._id}`
          );
        }

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
    stopProgressIndicator(indicatorId, `${files.length} variables imported.`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing variables`, 'fail');
    printError(error);
    return false;
  }
}
