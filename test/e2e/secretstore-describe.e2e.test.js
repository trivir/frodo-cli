import { getEnv, testSuccess } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo secretstore describe', () => {
    test('"frodo secretstore describe -i ESV": should describe the ESV secret store', async () => {
        const CMD = `frodo secretstore describe -i ESV`;
        await testSuccess(CMD, env);
    });
    test('"frodo secretstore describe -gi EnvironmentAndSystemPropertySecretStore -t EnvironmentAndSystemPropertySecretStore -m classic": should describe the global EnvironmentAndSystemPropertySecretStore which does not have mappings', async () => {
        const CMD = `frodo secretstore describe -gi EnvironmentAndSystemPropertySecretStore -t EnvironmentAndSystemPropertySecretStore -m classic`;
        await testSuccess(CMD, classicEnv);
    });
    test('"frodo secretstore describe --secretstore-id default-keystore --secretstore-type KeyStoreSecretStore --global --type classic": should describe the global default keystore secret store', async () => {
        const CMD = `frodo secretstore describe --secretstore-id default-keystore --secretstore-type KeyStoreSecretStore --global --type classic`;
        await testSuccess(CMD, classicEnv);
    });
});
