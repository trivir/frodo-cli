import fs from 'fs';
import {
  frodo,
  type LogExporterSkeleton,
  type TelemetryExporterCategory,
  type TelemetryExportInterface,
} from '@rockcarver/frodo-lib';
import {
  createProgressIndicator,
  printError,
  printMessage,
  stopProgressIndicator,
} from '../utils/Console';

const { saveJsonToFile, getFilePath, readJsonFile } = frodo.utils;
const { exportTelemetry, importTelemetry, readTelemetry, deleteTelemetry } =
  frodo.cloud.telemetry;

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

/**
 * Imports telemetry configuration in config manager format
 * @param {TelemetryExporterCategory} category optional parameter to import telemetry by category.
 * @param {string} name optional parameter to import telemetry config by name.
 * @returns { Promise<boolean> } returns true if telemetry was successfully imported
 */
export async function configManagerImportTelemetry(
  category?: TelemetryExporterCategory,
  name?: string
): Promise<boolean> {
  let indicatorId = createProgressIndicator(
    'indeterminate',
    0,
    `Reading telemetry exporters...`
  );

  try {
    const telemetryDir = getFilePath('telemetry');

    if (!fs.existsSync(telemetryDir)) {
      stopProgressIndicator(
        indicatorId,
        'No telemetry exporters found to import',
        'fail'
      );
      return false;
    }

    const categories = fs
      .readdirSync(telemetryDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name as TelemetryExporterCategory)
      .filter((cat) => !category || cat === category);

    const importData = {
      telemetry: Object.fromEntries(categories.map((cat) => [cat, []])),
    } as TelemetryExportInterface;

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
        const provider = readJsonFile(filePath) as LogExporterSkeleton;
        (importData.telemetry[cat] as LogExporterSkeleton[]).push(provider);
        exportCounter++;
      }
    }
    if (exportCounter === 0) {
      stopProgressIndicator(
        indicatorId,
        name
          ? `No matching telemetry exporter found for ${name}`
          : 'No telemetry exporters found to import',
        'fail'
      );
      return false;
    }

    stopProgressIndicator(
      indicatorId,
      `Successfully read ${exportCounter} telemetry exporter(s).`,
      'success'
    );

    indicatorId = createProgressIndicator(
      'indeterminate',
      0,
      'Importing telemetry exporters...'
    );

    await importTelemetry(importData);

    stopProgressIndicator(
      indicatorId,
      `Successfully imported ${exportCounter} telemetry exporter(s).`,
      'success'
    );

    return true;
  } catch (error) {
    stopProgressIndicator(indicatorId, `Failed to import Telemetry.`, 'fail');
    printError(error, 'Error importing telemetry configuration');
    return false;
  }
}

/**
 * Deletes telemetry exporters in config manager format
 * @param {TelemetryExporterCategory} category optional exporter category
 * @param {string} name optional exporter name
 * @param {boolean} dryRun whether to simulate deletion
 * @returns {Promise<boolean>} true if deletion succeeded
 */
export async function configManagerDeleteTelemetry(
  category?: TelemetryExporterCategory,
  name?: string,
  dryRun = false
): Promise<boolean> {
  try {
    if (name && !category) {
      printMessage(
        'Named telemetry config requires a category (e.g. --category otlp).',
        'error'
      );
      return false;
    }
    const telemetry = await readTelemetry();
    const matches: { category: TelemetryExporterCategory; id: string }[] = [];
    for (const [cat, providers] of Object.entries(telemetry)) {
      if (category && cat !== category) {
        continue;
      }
      for (const provider of providers) {
        if (name && provider.id !== name) {
          continue;
        }
        matches.push({
          category: cat as TelemetryExporterCategory,
          id: provider.id,
        });
        if (dryRun) {
          printMessage(
            `Dry run: Deleting telemetry config: ${cat}/${provider.id}`
          );
        }
      }
    }
    if (matches.length === 0) {
      printMessage('Warning: telemetry config not found', 'warn');
      return true;
    }
    if (dryRun) {
      return true;
    }
    await deleteTelemetry(name, category);
    for (const match of matches) {
      printMessage(
        `Successfully deleted telemetry config: ${match.category}/${match.id}`
      );
    }
    return true;
  } catch (error) {
    printError(error);
    return false;
  }
}
