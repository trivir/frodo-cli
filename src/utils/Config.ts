import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';
import os from 'os';
import { printMessage } from './Console';

const { getDefaultNoiseFilter } = frodo.cloud.log;

export const FRODO_CONFIG_PATH_KEY = 'FRODO_CONFIG_PATH';
export const FRODO_LOG_NOISEFILTER_FILENAME = 'LoggingNoiseFilter.json';

export function getConfigPath(): string {
  return process.env[FRODO_CONFIG_PATH_KEY] || `${os.homedir()}/.frodo`;
}

function getCustomNoiseFilters(): Array<string> {
  const filename = `${getConfigPath()}/${FRODO_LOG_NOISEFILTER_FILENAME}`;
  let noiseFilter = [];
  try {
    const data = fs.readFileSync(filename, 'utf8');
    noiseFilter = JSON.parse(data);
  } catch (e) {
    printMessage(`Error reading ${filename} (${e.message})`, 'error');
  }
  return noiseFilter;
}

export function getNoiseFilters(defaults: boolean): Array<string> {
  const filename = `${getConfigPath()}/${FRODO_LOG_NOISEFILTER_FILENAME}`;
  if (defaults) {
    printMessage(`Using default logging noise filters.`, 'info');
    return getDefaultNoiseFilter();
  }
  let noiseFilter = getCustomNoiseFilters();
  if (noiseFilter.length == 0) {
    printMessage(`No custom noise filters defined. Using defaults.`, 'info');
    noiseFilter = getDefaultNoiseFilter();
    try {
      fs.writeFileSync(filename, JSON.stringify(noiseFilter, null, 2));
      printMessage(
        `The default filters were saved in ${filename}. You can change the filters as needed.`,
        'info'
      );
    } catch (e) {
      printMessage(
        `Error creating noise filter configuration with default values.`,
        'error'
      );
    }
  }
  return noiseFilter;
}

export function isIdUsed(configuration: any, id: string, isEsv: boolean): {
  used: boolean,
  location: string,
} {
  return isIdUsedRecurse(configuration, isEsv ?
    new RegExp(`[^a-z0-9._]?${id.replaceAll("-", "\.")}[^a-z0-9._]?`) :
    new RegExp(`[^a-z0-9-]?${id.replaceAll("-", "\-")}[^a-z0-9-]?`));
}

function isIdUsedRecurse(configuration: any, regex: RegExp): {
  used: boolean,
  location: string,
} {
  const type = typeof configuration;
  if (type === 'object' && configuration !== null) {
    for (const [id, value] of Object.entries(configuration as Record<string, any>)) {
      const isIdUsed = isIdUsedRecurse(value, regex);
      if (isIdUsed.used) {
        isIdUsed.location = id + (value.name ? `(name: '${value.name}')` : '') + (isIdUsed.location === '' ? '' : '.') + isIdUsed.location;
        return isIdUsed;
      }
    }
  }
  return {
    used: type === 'string' && regex.test(configuration!),
    location: ''
  };
}
