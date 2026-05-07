import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pulls', () => {
  test('"frodo config-manager pull journeys -D testDir11": should export the journeys in fr-config-manager style"', async () => {
      const dirName = 'testDir11';
      const CMD = `frodo config-manager pull journeys -D ${dirName}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull journeys -r alpha -D testDir12": should export the journeys in alpha realm in fr-config-manager style"', async () => {
      const dirName = 'testDir12';
      const CMD = `frodo config-manager pull journeys -r alpha -D ${dirName}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull journeys -r alpha -n FrodoTest -D testDir13": should export journey with name: FrodoTest in fr-config-manager style"', async () => {
      const dirName = 'testDir13';
      const CMD = `frodo config-manager pull journeys -r alpha -n FrodoTest -D ${dirName}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull journeys -D testDir14 --pull-dependencies": should export the journeys in fr-config-manager style"', async () => {
      const dirName = 'testDir14';
      const CMD = `frodo config-manager pull journeys -D ${dirName} --pull-dependencies`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
    });
});