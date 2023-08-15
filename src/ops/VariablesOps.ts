import { frodo } from '@rockcarver/frodo-lib';
import {
  createKeyValueTable,
  createProgressBar,
  createTable,
  failSpinner,
  printMessage,
  showSpinner,
  stopProgressBar,
  succeedSpinner,
  updateProgressBar,
} from '../utils/Console';
import wordwrap from './utils/Wordwrap';

const { decode } = frodo.helper.base64;
const { resolveUserName } = frodo.idm.managed;
const { getVariables, getVariable, putVariable } = frodo.cloud.variable;
const { exportFullConfiguration } = frodo.admin;

/**
 * List variables
 * @param {boolean} long Long version, all the fields
 */
export async function listVariables(long) {
  let variables = [];
  try {
    variables = (await getVariables()).result;
    variables.sort((a, b) => a._id.localeCompare(b._id));
  } catch (error) {
    printMessage(`${error.message}`, 'error');
    printMessage(error.response.data, 'error');
  }
  if (long) {
    const fullExport = await exportFullConfiguration(true, true);
    const table = createTable([
      'Id'['brightCyan'],
      'Value'['brightCyan'],
      'Status'['brightCyan'],
      'Description'['brightCyan'],
      'Modifier'['brightCyan'],
      'Modified'['brightCyan'],
      'Used'['brightCyan'],
    ]);
    for (const variable of variables) {
      const isEsvUsed = isESVUsed(fullExport, new RegExp(`[^a-z0-9._]${variable._id.replaceAll("-", "\.")}[^a-z0-9._]`));
      table.push([
        variable._id,
        wordwrap(decode(variable.valueBase64), 40),
        variable.loaded ? 'loaded'['brightGreen'] : 'unloaded'['brightRed'],
        wordwrap(variable.description, 40),
        // eslint-disable-next-line no-await-in-loop
        await resolveUserName('teammember', variable.lastChangedBy),
        new Date(variable.lastChangeDate).toLocaleString(),
        isEsvUsed.used ? `${'yes'['brightGreen']} (at ${isEsvUsed.location})` : 'no'['brightRed'],
      ]);
    }
    printMessage(table.toString(), 'data');
  } else {
    variables.forEach((secret) => {
      printMessage(secret._id, 'data');
    });
  }
}

/**
 * Create variable
 * @param {String} variableId variable id
 * @param {String} value variable value
 * @param {String} description variable description
 */
export async function createVariable(variableId, value, description) {
  showSpinner(`Creating variable ${variableId}...`);
  try {
    await putVariable(variableId, value, description);
    succeedSpinner(`Created variable ${variableId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Update variable
 * @param {String} variableId variable id
 * @param {String} value variable value
 * @param {String} description variable description
 */
export async function updateVariable(variableId, value, description) {
  showSpinner(`Updating variable ${variableId}...`);
  try {
    await putVariable(variableId, value, description);
    succeedSpinner(`Updated variable ${variableId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Set description of variable
 * @param {String} variableId variable id
 * @param {String} description variable description
 */
export async function setVariableDescription(variableId, description) {
  showSpinner(`Setting description of variable ${variableId}...`);
  try {
    await setVariableDescription(variableId, description);
    succeedSpinner(`Set description of variable ${variableId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Delete a variable
 * @param {String} variableId variable id
 */
export async function deleteVariable(variableId) {
  showSpinner(`Deleting variable ${variableId}...`);
  try {
    await deleteVariable(variableId);
    succeedSpinner(`Deleted variable ${variableId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Delete all variables
 */
export async function deleteVariables() {
  try {
    const variables = (await getVariables()).result;
    createProgressBar(variables.length, `Deleting variable...`);
    for (const variable of variables) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteVariable(variable._id);
        updateProgressBar(`Deleted variable ${variable._id}`);
      } catch (error) {
        printMessage(
          `Error: ${error.response.data.code} - ${error.response.data.message}`,
          'error'
        );
      }
    }
    stopProgressBar(`Variables deleted.`);
  } catch (error) {
    stopProgressBar(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
    printMessage(
      `Error: ${error.response.data.code} - ${error.response.data.message}`,
      'error'
    );
  }
}

/**
 * Describe a variable
 * @param {String} variableId variable id
 */
export async function describeVariable(variableId) {
  const variable = await getVariable(variableId);
  const table = createKeyValueTable();
  table.push(['Name'['brightCyan'], variable._id]);
  table.push([
    'Value'['brightCyan'],
    wordwrap(decode(variable.valueBase64), 40),
  ]);
  table.push([
    'Status'['brightCyan'],
    variable.loaded ? 'loaded'['brightGreen'] : 'unloaded'['brightRed'],
  ]);
  table.push(['Description'['brightCyan'], wordwrap(variable.description, 60)]);
  table.push([
    'Modified'['brightCyan'],
    new Date(variable.lastChangeDate).toLocaleString(),
  ]);
  table.push([
    'Modifier'['brightCyan'],
    await resolveUserName('teammember', variable.lastChangedBy),
  ]);
  table.push(['Modifier UUID'['brightCyan'], variable.lastChangedBy]);
  printMessage(table.toString());
}

function isESVUsed(fullConfiguration: any, esvRegex: RegExp): {
  used: boolean,
  location: string,
} {
  const type = typeof fullConfiguration;
  if (type === 'object' && fullConfiguration !== null) {
    for (const [id, value] of Object.entries(fullConfiguration)) {
      const isEsvUsed = isESVUsed(value, esvRegex);
      if (isEsvUsed.used) {
        isEsvUsed.location = id + (isEsvUsed.location === '' ? '' : '.') + isEsvUsed.location;
        return isEsvUsed;
      }
    }
  }
  return {
    used: type === 'string' && esvRegex.test(fullConfiguration!),
    location: ''
  };
}
