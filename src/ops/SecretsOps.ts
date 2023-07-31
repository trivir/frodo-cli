import { frodo, state } from '@rockcarver/frodo-lib';
import {
  createKeyValueTable,
  createProgressBar, createProgressIndicator,
  createTable,
  debugMessage,
  failSpinner,
  printMessage,
  showSpinner,
  stopProgressBar, stopProgressIndicator,
  succeedSpinner,
  updateProgressBar, updateProgressIndicator,
} from '../utils/Console';
import wordwrap from './utils/Wordwrap';
import {getTypedFilename, saveJsonToFile, saveToFile, titleCase} from "../utils/ExportImportUtils";

const { resolveUserName } = frodo.idm.managed;
const {
  getSecrets,
  putSecret,
  getSecretVersions,
  getSecret,
  exportSecret,
  exportSecrets,
  setStatusOfVersionOfSecret,
  createNewVersionOfSecret: _createNewVersionOfSecret,
  setSecretDescription: _setSecretDescription,
  deleteSecret: _deleteSecret,
  deleteVersionOfSecret: _deleteVersionOfSecret,
} = frodo.cloud.secret;

/**
 * List secrets
 * @param {boolean} long Long version, all the fields
 */
export async function listSecrets(long) {
  let secrets = [];
  try {
    secrets = (await getSecrets()).result;
    secrets.sort((a, b) => a._id.localeCompare(b._id));
  } catch (error) {
    printMessage(`${error.message}`, 'error');
    printMessage(error.response.data, 'error');
  }
  if (long) {
    const table = createTable([
      'Id'['brightCyan'],
      { hAlign: 'right', content: 'Active\nVersion'['brightCyan'] },
      { hAlign: 'right', content: 'Loaded\nVersion'['brightCyan'] },
      'Status'['brightCyan'],
      'Description'['brightCyan'],
      'Modifier'['brightCyan'],
      'Modified'['brightCyan'],
    ]);
    for (const secret of secrets) {
      table.push([
        secret._id,
        { hAlign: 'right', content: secret.activeVersion },
        { hAlign: 'right', content: secret.loadedVersion },
        secret.loaded ? 'loaded'['brightGreen'] : 'unloaded'['brightRed'],
        wordwrap(secret.description, 40),
        await resolveUserName('teammember', secret.lastChangedBy),
        new Date(secret.lastChangeDate).toLocaleString(),
      ]);
    }
    printMessage(table.toString(), 'data');
  } else {
    secrets.forEach((secret) => {
      printMessage(secret._id, 'data');
    });
  }
}

/**
 * Create secret
 * @param {String} id secret id
 * @param {String} value secret value
 * @param {String} description secret description
 * @param {String} encoding secret encoding
 * @param {boolean} useInPlaceholders use secret in placeholders
 */
export async function createSecret(
  id,
  value,
  description,
  encoding,
  useInPlaceholders
) {
  showSpinner(`Creating secret ${id}...`);
  try {
    await putSecret(id, value, description, encoding, useInPlaceholders);
    succeedSpinner(`Created secret ${id}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Set description of secret
 * @param {String} secretId secret id
 * @param {String} description secret description
 */
export async function setSecretDescription(secretId, description) {
  showSpinner(`Setting description of secret ${secretId}...`);
  try {
    await _setSecretDescription(secretId, description);
    succeedSpinner(`Set description of secret ${secretId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Delete a secret
 * @param {String} secretId secret id
 */
export async function deleteSecret(secretId) {
  showSpinner(`Deleting secret ${secretId}...`);
  try {
    await _deleteSecret(secretId);
    succeedSpinner(`Deleted secret ${secretId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Delete all secrets
 */
export async function deleteSecrets() {
  try {
    const secrets = (await getSecrets()).result;
    createProgressBar(secrets.length, `Deleting secrets...`);
    for (const secret of secrets) {
      try {
        await _deleteSecret(secret._id);
        updateProgressBar(`Deleted secret ${secret._id}`);
      } catch (error) {
        printMessage(
          `Error: ${error.response.data.code} - ${error.response.data.message}`,
          'error'
        );
      }
    }
    stopProgressBar(`Secrets deleted.`);
  } catch (error) {
    printMessage(
      `Error: ${error.response.data.code} - ${error.response.data.message}`,
      'error'
    );
  }
}

/**
 * List all the versions of the secret
 * @param {String} secretId secret id
 */
export async function listSecretVersions(secretId) {
  let versions = [];
  try {
    versions = await getSecretVersions(secretId);
  } catch (error) {
    printMessage(`${error.message}`, 'error');
    printMessage(error.response.data, 'error');
  }
  const table = createTable([
    { hAlign: 'right', content: 'Version'['brightCyan'] },
    'Status'['brightCyan'],
    'Loaded'['brightCyan'],
    'Created'['brightCyan'],
  ]);
  // versions.sort((a, b) => a._id.localeCompare(b._id));
  const statusMap = {
    ENABLED: 'active'['brightGreen'],
    DISABLED: 'inactive'['brightRed'],
    DESTROYED: 'deleted'['brightRed'],
  };
  for (const version of versions) {
    table.push([
      { hAlign: 'right', content: version.version },
      statusMap[version.status],
      version.loaded ? 'loaded'['brightGreen'] : 'unloaded'['brightRed'],
      new Date(version.createDate).toLocaleString(),
    ]);
  }
  printMessage(table.toString());
}

/**
 * Describe a secret
 * @param {String} secretId Secret id
 */
export async function describeSecret(secretId) {
  const secret = await getSecret(secretId);
  const table = createKeyValueTable();
  table.push(['Name'['brightCyan'], secret._id]);
  table.push(['Active Version'['brightCyan'], secret.activeVersion]);
  table.push(['Loaded Version'['brightCyan'], secret.loadedVersion]);
  table.push([
    'Status'['brightCyan'],
    secret.loaded ? 'loaded'['brightGreen'] : 'unloaded'['brightRed'],
  ]);
  table.push(['Description'['brightCyan'], wordwrap(secret.description, 60)]);
  table.push([
    'Modified'['brightCyan'],
    new Date(secret.lastChangeDate).toLocaleString(),
  ]);
  table.push([
    'Modifier'['brightCyan'],
    await resolveUserName('teammember', secret.lastChangedBy),
  ]);
  table.push(['Modifier UUID'['brightCyan'], secret.lastChangedBy]);
  table.push(['Encoding'['brightCyan'], secret.encoding]);
  table.push(['Use In Placeholders'['brightCyan'], secret.useInPlaceholders]);
  printMessage(table.toString());
  printMessage('\nSecret Versions:');
  await listSecretVersions(secretId);
}

/**
 * Export a single secret to file
 * @param {String} secretId Secret id
 * @param {String} file Optional filename
 */
export async function exportSecretToFile(secretId, file = null) {
  debugMessage(
    `Cli.SecretsOps.exportSecretToFile: start [entityId=${secretId}, file=${file}]`
  );
  let fileName = file;
  if (!fileName) {
    fileName = getTypedFilename(secretId, 'secret');
  }
  try {
    createProgressBar(1, `Exporting secret ${secretId}`);
    const fileData = await exportSecret(secretId);
    saveJsonToFile(fileData, fileName);
    updateProgressBar(`Exported secret ${secretId}`);
    stopProgressBar(
      `Exported ${secretId.brightCyan} to ${fileName.brightCyan}.`
    );
  } catch (err) {
    stopProgressBar(`${err}`);
    printMessage(err, 'error');
  }
  debugMessage(
    `Cli.SecretsOps.exportSecretToFile: end [secretId=${secretId}, file=${fileName}]`
  );
}

/**
 * Export all secrets to single file
 * @param {string} file Optional filename
 */
export async function exportSecretsToFile(file: string) {
  debugMessage(`Cli.SecretsOps.exportSecretsToFile: start`);
  let fileName = file;
  if (!fileName) {
    fileName = getTypedFilename(`all${titleCase(state.getRealm())}Secrets`, 'secret');
  }
  try {
    const secretsExport = await exportSecrets();
    saveJsonToFile(secretsExport, fileName);
  } catch (error) {
    printMessage(error.message, 'error');
    printMessage(
      `exportSecretsToFile: ${error.response?.status}`,
      'error'
    );
  }
  debugMessage(`Cli.SecretsOps.exportSecretsToFile: end [file=${file}]`);
}

/**
 * Export all secrets to individual files
 */
export async function exportSecretsToFiles() {
  const secretsList = (await getSecrets()).result;
  if (secretsList.length === 0) {
    printMessage('No secrets found.', 'info');
  }
  createProgressIndicator(
    'determinate',
    secretsList.length,
    'Exporting secrets'
  );
  for (const secret of secretsList) {
    updateProgressIndicator(`Writing secret ${secret._id}`);
    const fileName = getTypedFilename(secret._id, 'secret');
    saveToFile('secret', secret, '_id', fileName);
  }
  stopProgressIndicator(`${secretsList.length} secrets exported`);
}

/**
 * Create new version of secret
 * @param {String} secretId secret id
 * @param {String} value secret value
 */
export async function createNewVersionOfSecret(secretId, value) {
  showSpinner(`Creating new version of secret ${secretId}...`);
  try {
    const version = await _createNewVersionOfSecret(secretId, value);
    succeedSpinner(`Created version ${version.version} of secret ${secretId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Activate a version of a secret
 * @param {String} secretId secret id
 * @param {Number} version version of secret
 */
export async function activateVersionOfSecret(secretId, version) {
  showSpinner(`Activating version ${version} of secret ${secretId}...`);
  try {
    await setStatusOfVersionOfSecret(secretId, version, 'ENABLED');
    succeedSpinner(`Activated version ${version} of secret ${secretId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Deactivate a version of a secret
 * @param {String} secretId secret id
 * @param {Number} version version of secret
 */
export async function deactivateVersionOfSecret(secretId, version) {
  showSpinner(`Deactivating version ${version} of secret ${secretId}...`);
  try {
    await setStatusOfVersionOfSecret(secretId, version, 'DISABLED');
    succeedSpinner(`Deactivated version ${version} of secret ${secretId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}

/**
 * Delete version of secret
 * @param {String} secretId secret id
 * @param {Number} version version of secret
 */
export async function deleteVersionOfSecret(secretId, version) {
  showSpinner(`Deleting version ${version} of secret ${secretId}...`);
  try {
    await _deleteVersionOfSecret(secretId, version);
    succeedSpinner(`Deleted version ${version} of secret ${secretId}`);
  } catch (error) {
    failSpinner(
      `Error: ${error.response.data.code} - ${error.response.data.message}`
    );
  }
}
