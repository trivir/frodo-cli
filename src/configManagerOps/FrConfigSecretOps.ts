import { frodo } from '@rockcarver/frodo-lib';
import { SecretSkeleton } from '@rockcarver/frodo-lib/types/api/cloud/SecretsApi';
import { SecretsExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/SecretsOps';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';
import { esvToEnv } from '../utils/FrConfig';

const { getFilePath, saveJsonToFile } = frodo.utils;
const { readSecrets, exportSecret, readVersionsOfSecret } = frodo.cloud.secret;

type FrConfigSecret = SecretSkeleton & {
  valueBase64: string;
};

/**
 * Export all secrets to individual files in fr-config-manager format
 * @param {boolean} activeOnly true to export only active secrets, false will export all active or not
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerExportSecrets(
  activeOnly?: boolean
): Promise<boolean> {
  let secrets: FrConfigSecret[] = [];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading secrets...`
  );
  try {
    secrets = (await readSecrets()) as FrConfigSecret[];
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
        false
      );
      const [secretKey] = Object.keys(exportData.secret);
      const fullSecret = exportData.secret[secretKey] as FrConfigSecret;
      const cleanSecret: Partial<SecretSkeleton> = {
        _id: fullSecret._id,
        description: fullSecret.description,
        encoding: fullSecret.encoding,
        useInPlaceholders: fullSecret.useInPlaceholders,
      };
      if (activeOnly) {
        cleanSecret.valueBase64 = `\${${esvToEnv(secret._id)}}`;
      } else {
        const versionsResponse = await readVersionsOfSecret(fullSecret._id);
        const versions = versionsResponse.filter(
          (version) => version.status !== 'DESTROYED'
        );
        const versionInfo = versions.map((version) => ({
          version: version.version,
          status: version.status,
          valueBase64: `\${${esvToEnv(`${secret._id}_${version.version}`)}}`,
        }));
        cleanSecret.versions = versionInfo;
      }

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
