
import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { TelemetryExporterCategory } from '@rockcarver/frodo-lib/types/api/cloud/TelemetryApi';
import {
  createProgressIndicator,
  printError,
  stopProgressIndicator,
  updateProgressIndicator,
} from '../utils/Console';

import fs from 'fs'


const { saveJsonToFile, getFilePath } = frodo.utils;
const { exportTelemetry, importTelemetry } = frodo.cloud.telemetry;

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
    stopProgressIndicator(indicatorId, `Error importing telemetry exporters`, 'fail');
    printError(error);
    return false;
  }
}

