import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pulls', () => {
  test('"frodo config-manager pull service-objects -f test/fr-config-manager-pull-config/service-objects.json -D objectTestDir": should export the service-objects based on service-objects.json config file in fr-config-manager style"', async () => {
      const dirName = 'objectTestDir';
      const CMD = `frodo config-manager pull service-objects -f test/e2e/fr-config-manager-pull-config/service-objects.json -D ${dirName}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
    });
});