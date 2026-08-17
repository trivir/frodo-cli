import { frodo } from '@rockcarver/frodo-lib';
import {
  SecretSkeleton,
  VersionOfSecretSkeleton,
} from '@rockcarver/frodo-lib/types/api/cloud/SecretsApi';
import { SecretsExportInterface } from '@rockcarver/frodo-lib/types/ops/cloud/SecretsOps';
import fs from 'fs';

import {
  createProgressIndicator,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { getFilePath, saveJsonToFile, readJsonFile } = frodo.utils;
const {
  readSecrets,
  exportSecret,
  createSecret,
  createVersionOfSecret,
  pruneVersionsOfSecret,
  importSecrets,
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

/**
 * Import secrets to to cloud from fr-config-manager format
 * @param {string} secretName optional name of secret to import
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function configManagerImportSecrets(
  secretName?: string,
  prune?: boolean
): Promise<boolean> {
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
      return false;
    }

    const fileNames = fs
      .readdirSync(secretsDir)
      .filter((name) => name.toLowerCase().endsWith('.json'))
      .filter((name) => !secretName || name === `${secretName}.json`);

    if (fileNames.length === 0) {
      stopProgressIndicator(
        spinnerId,
        secretName
          ? `No matching secret found for ${secretName}`
          : 'No secrets found to import',
        'fail'
      );
      return false;
    }

    stopProgressIndicator(
      spinnerId,
      `Successfully read ${fileNames.length} secrets.`,
      'success'
    );

    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing secrets'
    );

    const remoteSecrets = Object.fromEntries(
      (await readSecrets()).map((s) => [s._id, s])
    );
    const secrets = {} as Record<string, SecretSkeleton>;

    for (const fileName of fileNames) {
      try {
        const secret = readJsonFile(
          `${secretsDir}/${fileName}`
        ) as SecretSkeleton & {
          valueBase4?: string;
          versions?: VersionOfSecretSkeleton[];
        };
        if (prune) await pruneVersionsOfSecret(secret._id, false, true);
        if (secret.valueBase64 !== undefined) {
          secret.activeValue = secret.valueBase64;
        } else {
          const versions = [...secret.versions].sort((a, b) =>
            Number(a.version) - Number(b.version) ? 1 : -1
          );
          for (let i = 0; i < versions.length - 1; ++i) {
            if (i === 0 && !remoteSecrets[secret._id]) {
              await createSecret(
                secret._id,
                versions[i].valueBase64,
                secret.description,
                secret.encoding,
                secret.useInPlaceholders
              );
            } else {
              await createVersionOfSecret(secret._id, versions[i].valueBase64);
            }
          }
          secret.activeValue = versions[versions.length - 1].valueBase64;
        }
        secrets[secret._id] = secret;
      } catch (e) {
        printError(e, `Error importing secret from "${fileName}"`);
      }
    }
    const includeActiveValues = true;

    const imported = await importSecrets(
      { secret: secrets },
      includeActiveValues
    );

    let unchanged = 0;
    let updated = 0;

    for (const s of imported) {
      if (
        remoteSecrets[s._id] &&
        remoteSecrets[s._id].activeVersion === s.activeVersion
      ) {
        printMessage(`Secret ${s._id} unchanged version ${s.activeVersion}`);
        unchanged++;
      } else {
        printMessage(`Secret ${s._id} created version ${s.activeVersion}`);
        updated++;
      }
    }

    stopProgressIndicator(indicatorId, `${imported.length} secrets imported.`);

    printMessage(
      updated > 0
        ? `Changes made to secrets: ${updated} updated, ${unchanged} unchanged`
        : `No changes, (${unchanged} secrets(s) already up to date)`
    );

    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Error importing secrets`, 'fail');
    printError(error);
    return false;
  }
}
