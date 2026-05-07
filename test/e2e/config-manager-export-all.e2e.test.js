import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pulls', () => {
   test('"frodo config-manager pull all -D allDir1": should export all config in fr-config-manager style"', async () => {
     const dirName = 'allDir1';
     const CMD = `frodo config-manager pull all -F test/e2e/fr-config-manager-pull-config -D ${dirName}`;
     await testExport(CMD, env, undefined, undefined, dirName, false);
   });
 
});