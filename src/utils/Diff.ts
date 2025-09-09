import { frodo, state } from '@rockcarver/frodo-lib';
import { structuredPatch } from 'diff';
import fs from 'fs';

import { printMessage } from './Console';

const { getFilePath } = frodo.utils;

const { deleteDeepByKey, stringify } = frodo.utils.json;

export type DiffOptions = {
  oldFile?: string;
  oldId?: string;
  oldName?: string;
  newFile?: string;
  newId?: string;
  newName?: string;
};

export type DepsOption = { deps: boolean };

export type Exporter<T, V> = (
  id?: string,
  name?: string,
  exportOptions?: V
) => Promise<T>;

export type Differ<T, V> = (
  oldConfig: T,
  newConfig: T,
  diffOptions?: DiffOptions & V
) => string[];

/**
 * Parses JSON from a given file
 * @param {string} file File name
 * @returns {T} JSON object
 */
export function readJsonFromFile<T>(file: string): T {
  const filePath = getFilePath(file);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    printMessage(`Error parsing JSON from ${filePath} (${e.message})`, 'error');
    process.exit(1);
  }
}

/**
 * Helper that deep deletes several keys from several objects
 *
 * @param {T[]} objs The list of objects to delete keys from
 * @param {string[]} keys The keys of the objects to delete
 * @returns The modified objects without the matching keys and their values
 */
export function deleteDeepByKeys<T>(objs: T[], keys: string[]): T[] {
  return objs.map((o) => {
    for (const k of keys) {
      deleteDeepByKey(o, k);
    }
    return o;
  });
}

/**
 * Compare two objects (or sub-objects) and return targeted differences.
 * This is a general diff, which may produce top-level or nested diffs.
 *
 * @param {object} objOld - The original sanitized object.
 * @param {object} objNew - The updated sanitized object.
 * @param {number} level - The level of diff recursion.
 * @param {number} indentation - The indentation for the diff.
 * @returns {string[]} Array of diff strings representing the changes.
 */
export function diffObjects(
  objOld: object,
  objNew: object,
  level: number = 0,
  indentation: number = 2
): string[] {
  const diffs = [];
  const keys1 = Object.keys(objOld || {});
  const keys2 = Object.keys(objNew || {});
  const allKeys = new Set([...keys1, ...keys2]);

  diffs.push(' '.repeat(level) + '{');
  for (const key of allKeys) {
    const oldVal = objOld ? objOld[key] : undefined;
    const newVal = objNew ? objNew[key] : undefined;

    if (oldVal !== undefined && newVal !== undefined) {
      if (
        typeof oldVal === 'object' &&
        typeof newVal === 'object' &&
        oldVal !== null &&
        newVal !== null
      ) {
        diffs.push(...diffObjects(oldVal, newVal, level + 1, indentation));
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const prefix = '~' + ' '.repeat(level * indentation + 1);
        diffs.push(
          `${prefix}"${key}": ${getValueDiffString(oldVal)} -> ${getValueDiffString(newVal)},`
        );
      }
    } else if (oldVal !== undefined) {
      const prefix = '-' + ' '.repeat(level * indentation + 1);
      diffs.push(`${prefix}"${key}": ${getValueDiffString(oldVal, prefix)},`);
    } else if (newVal !== undefined) {
      const prefix = '+' + ' '.repeat(level * indentation + 1);
      diffs.push(`${prefix}"${key}": ${getValueDiffString(oldVal, prefix)},`);
    }
  }
  if (diffs[diffs.length - 1][diffs[diffs.length - 1].length - 1] === ',') {
    diffs[diffs.length - 1] = diffs[diffs.length - 1].slice(0, -1);
  }
  diffs.push(' '.repeat(level) + '}');
  return diffs.map((d) => {
    switch (d[0]) {
      case '+':
        return d.green;
      case '-':
        return d.red;
      case '~':
        return d.yellow;
      default:
        return d;
    }
  });
}

/**
 * Diffs lines in two strings, similar to how a git diff between two files would work
 * @param {string} oldStr The original string
 * @param {string} newStr The updated string
 * @returns {string[]} Array of diff strings representing the changes.
 */
export function diffStrings(oldStr: string, newStr: string): string[] {
  const diff = [];
  const patch = structuredPatch(
    'a/old',
    'b/new',
    oldStr,
    newStr,
    undefined,
    undefined,
    {
      context: 3,
      ignoreWhitespace: false,
      stripTrailingCr: false,
    }
  );
  for (const hunk of patch.hunks) {
    diff.push(
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
        .cyan
    );
    for (const line of hunk.lines) {
      if (line.startsWith('+')) {
        diff.push(line.green);
      } else if (line.startsWith('-')) {
        diff.push(line.red);
      } else {
        diff.push(line);
      }
    }
  }
  return diff;
}

function getValueDiffString(val: any, prefix: string = ''): string {
  if (typeof val === 'object' && val !== null) {
    if (!state.getVerbose()) {
      return Array.isArray(val) ? '[...]' : '{...}';
    }
    const str = stringify(val);
    const lines = str.split('\n');
    for (let i = 1; i < lines.length; ++i) {
      lines[i] = prefix + lines[i];
    }
    return lines.join('\n');
  }
  return stringify(val);
}
