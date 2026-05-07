import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pull cors', () => {
    test('"frodo config-manager pull cors -D configManagerExportCorsDir0": should export globals CORS configuration in fr-config manager style.', async () => {
        const dirName = 'configManagerExportCorsDir0';
        const CMD = `frodo config-manager pull cors -D ${dirName}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
});