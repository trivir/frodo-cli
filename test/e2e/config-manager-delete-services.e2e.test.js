/** See test/e2e/README.md for how to write and record e2e tests. */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete services -n email  
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete services  
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete services --dry-run  
*/


import { getEnv, testFail, testSuccess } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager delete', () => {
  test('"frodo config-manager delete services -n email": should delete the named service in alpha realm"', async () => {
      const CMD = `frodo config-manager delete services -n email`;
      await testSuccess(CMD, {
        env: {
          ...env.env,
          FRODO_REALM: '/alpha',
        },
      });
    });
    
    test('"frodo config-manager delete services": should delete all the allowed services in the alpha realm"', async () => {
      const CMD = `frodo config-manager delete services`;
      await testFail(CMD, {
        env: {
          ...env.env,
          FRODO_REALM: '/alpha',
        },
      });
    });

    test('"frodo config-manager delete services --dry-run": should show a dry run of which services would be deleted in alpha realm"', async () => {
      const CMD = `frodo config-manager delete services --dry-run`;
      await testSuccess(CMD, {
        env: {
          ...env.env,
          FRODO_REALM: '/alpha',
        },
      });
    });
});