import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import fs from 'fs';

import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

const { saveJsonToFile, getFilePath, readToJson, loadEnvFile } = frodo.utils;
const { exportTelemetry, importTelemetry } = frodo.cloud.telemetry;
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
export async function configManagerImportTelemetry(
  category?: 'otlp' | 'splunk',
  name?: string,
  value?: string
): Promise<boolean> {
  const errors = [];
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading telemetry exporters...`
  );
  let indicatorId: string;
  try {
    const envFile = loadEnvFile();
    const categories: ('otlp' | 'splunk')[] = category
      ? [category]
      : ['otlp', 'splunk'];
    const targets: { cat: 'otlp' | 'splunk'; file: string }[] = [];
    for (const cat of categories) {
      const catDir = getFilePath(`telemetry/${cat}`);
      if (!fs.existsSync(catDir)) {
        continue;
      }
      const files = fs
        .readdirSync(catDir)
        .filter((f) => f.toLowerCase().endsWith('.json'))
        .filter((f) => !name || f === `${name}.json`);
      for (const f of files) {
        targets.push({ cat, file: `${catDir}/${f}` });
      }
    }
    if (targets.length === 0) {
      stopProgressIndicator(
        spinnerId,
        name
          ? `No matching telemetry exporter found for ${name}`
          : 'No telemetry exporters found to import',
        'fail'
      );
      return true;
    }
    stopProgressIndicator(
      spinnerId,
      `Successfully read ${targets.length} telemetry exporter(s).`,
      'success'
    );
    indicatorId = createProgressIndicator(
      'determinate',
      targets.length,
      'Importing telemetry exporters'
    );
    for (const { cat, file } of targets) {
      try {
        const provider = readToJson(file, {
          overrideValue: value,
          envFile,
          base64Encode: false,
        });
        await importTelemetry(provider.id, cat, provider);
        updateProgressIndicator(
          indicatorId,
          `Imported ${cat} exporter ${provider.id}`
        );
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new FrodoError(`Error importing telemetry exporters`, errors);
    }
    stopProgressIndicator(
      indicatorId,
      `${targets.length} telemetry exporter(s) imported.`
    );
    return true;
  } catch (error) {
    stopProgressIndicator(
      indicatorId,
      `Error importing telemetry exporters`,
      'fail'
    );
    printError(error);
    return false;
  }
}
