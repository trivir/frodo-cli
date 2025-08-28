import { frodo } from '@rockcarver/frodo-lib';
import fs from 'fs';

import { printMessage } from './Console';

const { getFilePath } = frodo.utils;

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
  c1: T,
  c2: T,
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
