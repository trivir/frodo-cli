import { frodo } from '@rockcarver/frodo-lib';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { saveJsonToFile, getFilePath } = frodo.utils;
const { exportTelemetry } = frodo.cloud.telemetry;

export async function configManagerExportTelemetry(
  category?: 'otlp' | 'splunk',
  name?: string
): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    'reading telemetry exporters'
  );
  try {
    const exporters = await exportTelemetry(name, category);
    stopProgressIndicator(
      spinnerId,
      `Successfully read ${exporters.length} telemetry exporters`
    );

    if (exporters.length === 0) {
      return true;
    }

    const indicatorId = createProgressIndicator(
      'determinate',
      0,
      'Exporting telemetry '
    );

    for (const { category: cat, provider } of exporters) {
      const exportProvider = { ...provider };
      if ('headers' in exportProvider && exportProvider.headers) {
        const placeholders: Record<string, string> = {};
        for (const headerName of Object.keys(exportProvider.headers)) {
          placeholders[headerName] =
            `\${TELEMETRY_HEADER_${cat}_${provider.id}_${headerName}}`
              .replaceAll('-', '_')
              .toUpperCase();
        }
        exportProvider.headers = placeholders;
      }
      saveJsonToFile(
        exportProvider,
        getFilePath(`telemetry/${cat}/${provider.id}.json`, true),
        false
      );
      updateProgressIndicator(
        indicatorId,
        `Exported ${cat} exporter ${provider.id}`
      );
    }
    stopProgressIndicator(
      indicatorId,
      `${exporters.length} telemetry exporter(s) exported.`
    );
    return true;
  } catch (e) {
    stopProgressIndicator(spinnerId, 'Error exporting telemetry', 'fail');
    printError(e);
  }
  return false;
}
