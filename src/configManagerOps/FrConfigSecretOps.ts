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
const { readSecrets, readVersionsOfSecret, exportSecret } = frodo.cloud.secret;

type FrConfigSecret = SecretSkeleton & {
  valueBase64: string;
};

/**
 * Export all secrets to individual files in fr-config-manager format
 * @param {string} name secret name. If not specified, will export all secrets
 * @param {boolean} activeOnly true to exclude secret version history. Default: false
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportSecrets(
  name?: string,
  activeOnly?: boolean
): Promise<boolean> {
  let secrets: FrConfigSecret[];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading secrets...`
  );
  try {
    const allSecrets = (await readSecrets()).map((secret) => ({
      ...secret,
      valueBase64: `\${${secret._id.toUpperCase().replace(/-/g, '_')}}`,
    }));
    if (name) {
      const match = allSecrets.find((s) => s._id === name);
      if (!match) {
        stopProgressIndicator(spinnerId, `Secret '${name}' not found.`, 'fail');
        return false;
      }
      secrets = [match];
    } else {
      secrets = allSecrets.sort((a, b) => a._id.localeCompare(b._id));
    }
    updateProgressIndicator(spinnerId, `Saving secrets...`);
    for (const secret of secrets) {
      const exportData: SecretsExportInterface = await exportSecret(
        secret._id,
        false
      );
      const [secretKey] = Object.keys(exportData.secret);
      const fullSecret = exportData.secret[secretKey] as FrConfigSecret;
      const cleanSecret: Record<string, unknown> = {
        _id: fullSecret._id,
        description: fullSecret.description,
        encoding: fullSecret.encoding,
        useInPlaceholders: fullSecret.useInPlaceholders,
        valueBase64: secret.valueBase64,
      };
      if (!activeOnly) {
        const versions = await readVersionsOfSecret(secret._id);
        const baseKey = secret._id.toUpperCase().replace(/-/g, '_');
        delete cleanSecret.valueBase64;
        cleanSecret.versions = versions
          .sort((a, b) => Number(a.version) - Number(b.version))
          .map(({ version }) => ({
            valueBase64: `\${${baseKey}_${version}}`,
            version,
          }));
      }
      saveJsonToFile(
        cleanSecret,
        getFilePath(`esvs/secrets/${secret._id}.json`, true),
        false
      );
    }
    stopProgressIndicator(
      spinnerId,
      `${secrets.length} secrets exported.`,
      'success'
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
