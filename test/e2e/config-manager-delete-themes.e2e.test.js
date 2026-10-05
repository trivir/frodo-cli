/** See test/e2e/README.md for how to write and record e2e tests. */

/*
// ForgeOps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am FRODO_REALM=alpha frodo config-manager delete themes -n Test -m forgeops
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo config-manager delete themes -m forgeops
*/

import { getEnv, testSuccess } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
const forgeopsEnv = getEnv(fc);

describe('frodo config-manager delete themes', () => {
  test('should delete a specific theme by name in alpha', async () => {
    const CMD = 'frodo config-manager delete themes -n Test -m forgeops';
    await testSuccess(CMD, {
      env: {
        ...forgeopsEnv.env,
        FRODO_REALM: 'alpha',
      },
    });
  });
  test('should delete themes across non-root realms', async () => {
    const CMD = 'frodo config-manager delete themes -m forgeops';
    const env = { ...forgeopsEnv.env };
    delete env.FRODO_REALM;
    await testSuccess(CMD, { env });
  });
});