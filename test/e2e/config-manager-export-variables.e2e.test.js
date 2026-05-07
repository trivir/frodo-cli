import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pulls', () => {
  test('"frodo config-manager pull variables -D variableTestDir": should export the secrets in fr-config-manager style"', async () => {
    const dirName = 'variableTestDir';
    const CMD = `frodo config-manager pull variables -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
});