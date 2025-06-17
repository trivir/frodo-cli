import { frodo } from '@rockcarver/frodo-lib';

const { readRealms } = frodo.realm;

export async function realmList(): Promise<string[]> {
  const realms = await readRealms();
  const realmList = [];
  realms.forEach((realmConfig) => {
    realmList.push(`${realmConfig.name}`);
  });
  return realmList;
}
