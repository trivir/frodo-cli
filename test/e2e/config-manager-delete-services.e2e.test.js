/** See test/e2e/README.md for how to write and record e2e tests. */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager delete services -n email -r alpha
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager delete services -r alpha
*/


import { getEnv, testSuccess } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager delete', () => {
  test('"frodo config-manager delete services": should delete the named service"', async () => {
      const CMD = `frodo config-manager delete services -n email -r alpha`;
      await testSuccess(CMD, env);
    });
    
    test('"frodo config-manager delete services -r alpha": should delete the services in alpha realm"', async () => {
      const CMD = `frodo config-manager delete services -r alpha`;
      await testSuccess(CMD, env);
    });
});