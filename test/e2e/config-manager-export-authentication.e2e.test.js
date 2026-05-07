import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pulls', () => {
   test('"frodo config-manager pull authentication -D testDir2": should export the authentication in fr-config-manager style"', async () => {
      const dirName = 'testDir2';
      const CMD = `frodo config-manager pull authentication -D ${dirName}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull authentication -D testDir3 -r bravo": should export the authentication in bravo realm in fr-config-manager style"', async () => {
        const dirName = 'testDir3';
        const CMD = `frodo config-manager pull authentication -D ${dirName} -r bravo`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
      });
    
});