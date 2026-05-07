import { getEnv, testFail, testSuccess } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo secretstore delete', () => {
    test('"frodo secretstore delete -i ESV": should fail deleting ESV secret store', async () => {
        const CMD = `frodo secretstore delete -i ESV`;
        await testFail(CMD, env);
    });
    test('"frodo secretstore delete --all": should fail deleting any secret store', async () => {
        const CMD = `frodo secretstore delete --all`;
        await testFail(CMD, env);
    });
    test('"frodo secretstore delete -g --secretstore-id EnvironmentAndSystemPropertySecretStore --secretstore-type EnvironmentAndSystemPropertySecretStore -m classic": should fail deleting EnvironmentAndSystemPropertySecretStore', async () => {
        const CMD = `frodo secretstore delete -g --secretstore-id EnvironmentAndSystemPropertySecretStore --secretstore-type EnvironmentAndSystemPropertySecretStore -m classic`;
        await testFail(CMD, classicEnv);
    });
    test('"frodo secretstore delete --global -i default-keystore --type classic": should delete the global default keystore', async () => {
        const CMD = `frodo secretstore delete --global -i default-keystore --type classic`;
        await testSuccess(CMD, classicEnv);
    });
    test('"frodo secretstore delete -agm classic": should delete all global keystores with exception of EnvironmentAndSystemPropertySecretStore', async () => {
        const CMD = `frodo secretstore delete -agm classic`;
        await testFail(CMD, classicEnv);
    });
});
