import { frodo } from '@rockcarver/frodo-lib';
import { structuredPatch } from 'diff';
import fs from 'fs';

import { printMessage } from './Console';

const { getFilePath } = frodo.utils;

const { deleteDeepByKey } = frodo.utils.json;

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
 * @param {string} path - The path to the current object (for context).
 * @returns {string[]} Array of diff strings representing the changes.
 */
export function diffObjects(
  objOld: object,
  objNew: object,
  path: string = ''
): string[] {
  const diffs = [];
  const keys1 = Object.keys(objOld || {});
  const keys2 = Object.keys(objNew || {});
  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const pathWithKey = path ? `${path}.${key}` : key;
    const val1 = objOld ? objOld[key] : undefined;
    const val2 = objNew ? objNew[key] : undefined;

    if (val1 !== undefined && val2 !== undefined) {
      if (
        typeof val1 === 'object' &&
        typeof val2 === 'object' &&
        val1 !== null &&
        val2 !== null
      ) {
        diffs.push(...diffObjects(val1, val2, pathWithKey));
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diffs.push(
          `~ Property '${pathWithKey}' changed from '${JSON.stringify(val1)}' to '${JSON.stringify(val2)}'`
            .yellow
        );
      }
    } else if (val1 !== undefined) {
      diffs.push(
        `- Property '${pathWithKey}' removed (was '${JSON.stringify(val1)}')`
          .red
      );
    } else if (val2 !== undefined) {
      diffs.push(
        `+ Property '${pathWithKey}' added (is '${JSON.stringify(val2)}')`.green
      );
    }
  }
  return diffs;
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
