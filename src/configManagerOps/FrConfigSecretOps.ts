import { frodo } from '@rockcarver/frodo-lib';
import { SecretSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/SecretsApi';
import { SecretsExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/SecretsOps';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readSecrets, exportSecret, readSecret } = frodo.cloud.secret;

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

async function getFrConfigSecret(name: string): Promise<FrConfigSecret> {
  const secret = await readSecret(name);
  return {
    ...secret,
    valueBase64: `\${${secret._id.toUpperCase().replace(/-/g, '_')}}`,
  };
}

/**
 * Export all secrets or single secret by id/name to individual files in fr-config-manager format
 * @param {boolean} includeMeta true to include metadata, false otherwise. Default: true
 * @param {boolean} includeActiveValues include active value of secret (default: false)
 * @param {string} target Host URL of target environment to encrypt secret value for
 * @param {string} name secret name
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportSecrets(
  target?: string,
  name?: string
): Promise<boolean> {
  let secrets: FrConfigSecret[] = [];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading secrets...`
  );
  try {
    secrets = name
      ? [await getFrConfigSecret(name)]
      : await getFrConfigSecrets();
    if (!name) {
      secrets.sort((a, b) => a._id.localeCompare(b._id));
    }
    stopProgressIndicator(
      spinnerId,
      name
        ? `Successfully read secret "${name}".`
        : `Successfully read ${secrets.length} secrets.`,
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
    stopProgressIndicator(
      indicatorId,
      name
        ? `Secret "${name}" exported.`
        : `${secrets.length} secrets exported.`
    );
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
