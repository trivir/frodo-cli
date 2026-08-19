import { frodo } from '@rockcarver/frodo-lib';
import { TelemetryExporterCategory } from '@rockcarver/frodo-lib/types/api/cloud/TelemetryApi';

import { printError } from '../utils/Console';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { exportTelemetry } = frodo.cloud.telemetry;

/**
 * Exports telemetry configuration in config manager format
 * @param {TelemetryExporterCategory} category optional paremeter to export specific telemetry.
 * @param {string} name optional parameter to export telemetry config by name.
 * @returns { Promise<boolean> } returns true if telemetry was successfully exported
 */
export async function configManagerExportTelemetry(
  category?: TelemetryExporterCategory,
  name?: string
): Promise<boolean> {
  try {
    const exporters = await exportTelemetry(name, category);

    for (const [cat, providers] of Object.entries(exporters.telemetry)) {
      for (const provider of providers) {
        const exportProvider = provider as any;
        if (exportProvider.headers) {
          const placeholders: Record<string, string> = {};
          Object.keys(exportProvider.headers).forEach((headerName) => {
            placeholders[headerName] =
              `\${TELEMETRY_HEADER_${cat}_${provider.id}_${headerName}}`
                .replaceAll('-', '_')
                .toUpperCase();
          });
          exportProvider.headers = placeholders;
        }
        saveJsonToFile(
          exportProvider,
          getFilePath(`telemetry/${cat}/${provider.id}.json`, true),
          false
        );
      }
    }
    return true;
  } catch (e) {
    printError(e);
  }
  return false;
}
