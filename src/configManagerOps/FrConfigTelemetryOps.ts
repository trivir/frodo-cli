import { frodo } from '@rockcarver/frodo-lib';
import { TelemetryExporterCategory } from '@rockcarver/frodo-lib/types/api/cloud/TelemetryApi';

import { createProgressIndicator, printError, stopProgressIndicator } from '../utils/Console';
import { TelemetryExportInterface} from '@rockcarver/frodo-lib/types/ops/cloud/TelemetryOps';
import fs from 'fs'

const { saveJsonToFile, getFilePath, readJsonFile } = frodo.utils;
const { exportTelemetry, importTelemetry } = frodo.cloud.telemetry;

/**
 * Exports telemetry configuration in config manager format
 * @param {TelemetryExporterCategory} category optional parameter to export telemetry by category.
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
  category?: TelemetryExporterCategory,
  name?: string
): Promise<boolean> {
  const spinnerId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading telemetry exporters...`
  );
  let indicatorId: string;
  try {
    const telemetryDir = getFilePath('telemetry');

    if (!fs.existsSync(telemetryDir)) {
      stopProgressIndicator(
        spinnerId,
        'No telemetry exporters found to import',
        'fail'
      );
      return true;
    }

    const categories = fs
      .readdirSync(telemetryDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name as TelemetryExporterCategory)
      .filter((cat) => !category || cat === category);

    const importData: TelemetryExportInterface = {
      telemetry: Object.fromEntries(
        categories.map((cat) => [cat, []])
      ) as TelemetryExportInterface['telemetry'],
    };

    let exportCounter = 0;

    for (const cat of categories) {
      const catDir = getFilePath(`telemetry/${cat}`);
      if (!fs.existsSync(catDir)) {
        continue;
      }
      const files = fs
        .readdirSync(catDir)
        .filter((f) => f.toLowerCase().endsWith('.json'))
        .filter((f) => !name || f === `${name}.json`);
      for (const file of files) {
        const filePath = `${catDir}/${file}`;
        const provider = readJsonFile(filePath) as any;
        importData.telemetry[cat].push(provider);
        exportCounter++;
      }
    }
    if (exportCounter === 0) {
      stopProgressIndicator(
        spinnerId,
        name
          ? `No matching telemetry exporter found for ${name}`
          : 'No telemetry exporters found to import',
        'fail'
      );
      indicatorId = undefined;
      return true;
    }

    stopProgressIndicator(
      spinnerId,
      `Successfully read ${exportCounter} telemetry exporter(s).`,
      'success'
    );
    indicatorId = undefined;

    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing telemetry exporters...'
    );
    
    await importTelemetry(importData);
    
    stopProgressIndicator(
      spinnerId,
      `Successfully read ${exportCounter} telemetry exporter(s).`,
      'success'
    );

    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
