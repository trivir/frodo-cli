import { frodo } from '@rockcarver/frodo-lib';
import sanitize from 'sanitize-filename';

const { readRealms } = frodo.realm;

export async function realmList(): Promise<string[]> {
  const realms = await readRealms();
  return realms.map((r) => r.name);
}

export function safeFileName(filename: string): string {
  return sanitize(filename, {
    replacement: (character) => encodeURIComponent(character),
  });
}

export function safeFileNameUnderscore(filename) {
  return sanitize(filename, {
    replacement: '_',
  });
}
