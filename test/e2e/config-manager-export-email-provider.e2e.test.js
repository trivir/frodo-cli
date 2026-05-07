import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pull email-provider', () => {
    test('"frodo config-manager pull email-provider -D configManagerExportEmailProviderDir0": should export email provider configuration in fr-config manager style.', async () => {
        const dirName = 'configManagerExportEmailProviderDir0';
        const CMD = `frodo config-manager pull email-provider -D ${dirName}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
});