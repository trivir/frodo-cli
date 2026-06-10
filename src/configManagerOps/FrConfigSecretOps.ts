import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { SecretSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/SecretsApi';
import { SecretsExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/SecretsOps';
import fs from 'fs';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const {
  readSecrets,
  exportSecret,
  createSecret,
  createVersionOfSecret,
  readSecret,
} = frodo.cloud.secret;

/**
 * Export all secrets to individual files in fr-config-manager format
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} includeActiveValues include active value of secret (default: false)
 * @param {string} target Host URL of target environment to encrypt secret value for
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
type FrConfigSecret = SecretSkeleton & {
  valueBase64: string;
};

async function getFrConfigSecrets(): Promise<FrConfigSecret[]> {
  const originalSecrets = await readSecrets();
  return originalSecrets.map((secret) => ({
    ...secret,
    valueBase64: `\${${secret._id.toUpperCase().replace(/-/g, '_')}}`,
  }));
}

export async function configManagerExportSecrets(
  target?: string
): Promise<boolean> {
  let secrets: FrConfigSecret[] = [];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading secrets...`
  );
  try {
    secrets = await getFrConfigSecrets();
    secrets.sort((a, b) => a._id.localeCompare(b._id));
    stopProgressIndicator(
      spinnerId,
      `Successfully read ${secrets.length} secrets.`,
      'success'
    );
    const indicatorId = createProgressIndicator(
      'determinate',
      secrets.length,
      'Exporting secrets'
    );
    for (const secret of secrets) {
      const exportData: SecretsExportInterface = await exportSecret(
        secret._id,
        false,
        target
      );
      const [secretKey] = Object.keys(exportData.secret);
      const fullSecret = exportData.secret[secretKey] as FrConfigSecret;
      const cleanSecret = {
        _id: fullSecret._id,
        description: fullSecret.description,
        encoding: fullSecret.encoding,
        useInPlaceholders: fullSecret.useInPlaceholders,
        valueBase64: `\${${secret._id.toUpperCase().replace(/-/g, '_')}}`,
      };
      saveJsonToFile(
        cleanSecret,
        getFilePath(`esvs/secrets/${secret._id}.json`, true),
        false
      );
      updateProgressIndicator(indicatorId, `Exported secret ${secret._id}`);
    }
    stopProgressIndicator(indicatorId, `${secrets.length} secrets exported.`);
    return true;
  } catch (error) {
    stopProgressIndicator(
      spinnerId,
      `Error exporting secrets to files`,
      'fail'
    );
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

export async function configManagerImportSecrets(
  secretName?: string,
  value?: string
): Promise<boolean> {
  const errors = [];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading secrets...`
  );
  let indicatorId: string;
  try {
    const secretsDir = getFilePath(`esvs/secrets/`);
    if (!fs.existsSync(secretsDir)) {
      stopProgressIndicator(spinnerId, `No secrets found`, 'fail');
      return true;
    }

    const files = fs
      .readdirSync(secretsDir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .map((name) =>
        JSON.parse(fs.readFileSync(`${secretsDir}/${name}`, 'utf8'))
      )
      .filter((data) => !secretName || data._id === secretName);

    if (files.length === 0) {
      stopProgressIndicator(
        spinnerId,
        secretName
          ? `No matching secret found for ${secretName}`
          : 'No secrets found to import',
        'fail'
      );
      return true;
    }

    stopProgressIndicator(
      spinnerId,
      `Successfully read ${files.length} secrets.`,
      'success'
    );

    const envFile = loadEnvFile();

    indicatorId = createProgressIndicator(
      'determinate',
      files.length,
      'Importing secrets'
    );

    for (const importData of files) {
      try {
        let secretValue: string;
        if (value) {
          secretValue = value;
        } else if (importData.valueBase64) {
          secretValue = resolvePlaceholder(importData.valueBase64, envFile);
        } else {
          throw new FrodoError(
            `No value provided for secret ${importData._id}`
          );
        }

        let exists = true;
        try {
          await readSecret(importData._id);
        } catch {
          exists = false;
        }

        if (exists) {
          await createVersionOfSecret(importData._id, secretValue);
        } else {
          await createSecret(
            importData._id,
            secretValue,
            importData.description,
            importData.encoding,
            importData.useInPlaceholders
          );
        }
        updateProgressIndicator(
          indicatorId,
          `Imported secret ${importData._id}`
        );
      } catch (error) {
        errors.push(error);
      }
    }
    
    if (errors.length > 0) {
      throw new FrodoError(`Error importing secrets`, errors);
    }
    stopProgressIndicator(indicatorId, `${files.length} secrets imported.`);
    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing secrets`, 'fail');
    printError(error);
    return false;
  }
}
