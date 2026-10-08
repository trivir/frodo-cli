/** See test/e2e/README.md for how to write and record e2e tests. */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo config-manager delete cors -n custom plat
*/
import { getEnv, testSuccess } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const forgeopsEnv = getEnv(fc);

describe('frodo config-manager delete cors', () => {
    test('"frodo config-manager delete cors": should delete globals CORS configuration in fr-config manager style.', async () => {
        const CMD = `frodo config-manager delete cors`;
        await testSuccess(CMD, forgeopsEnv);
    });
});