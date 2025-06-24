import { frodo } from '@rockcarver/frodo-lib';

const { readRealms } = frodo.realm;
const { sanitize } = frodo.utils;

export async function realmList(): Promise<string[]> {
  const realms = await readRealms();
  const realmList = [];
  realms.forEach((realmConfig) => {
    realmList.push(`${realmConfig.name}`);
  });
  return realmList;
}

export function safeFileName(filename) {
  return sanitize(filename, {
    replacement: (character) => encodeURIComponent(character),
  });
}
