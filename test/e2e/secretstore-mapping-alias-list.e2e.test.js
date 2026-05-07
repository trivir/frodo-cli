import { getEnv, testFail, testSuccess } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo secretstore mapping alias list', () => {
    test('"frodo secretstore mapping alias list -i ESV -s am.services.httpclient.mtls.clientcert.testClientCert.secret": Should list the aliases for the ESV secret store mapping', async () => {
        const CMD = `frodo secretstore mapping alias list -i ESV -s am.services.httpclient.mtls.clientcert.testClientCert.secret`;
        await testSuccess(CMD, env);
    });
    test('"frodo secretstore mapping alias list -l -i ESV -t GoogleSecretManagerSecretStoreProvider -s am.services.httpclient.mtls.clientcert.testClientCert.secret": Should list the aliases for the ESV secret store mapping along with active statuses', async () => {
        const CMD = `frodo secretstore mapping alias list -l -i ESV -t GoogleSecretManagerSecretStoreProvider -s am.services.httpclient.mtls.clientcert.testClientCert.secret`;
        await testSuccess(CMD, env);
    });
    test('"frodo secretstore mapping alias list -gi EnvironmentAndSystemPropertySecretStore -s am.services.httpclient.mtls.clientcert.testClientCert.secret -m classic": should fail since EnvironmentAndSystemPropertySecretStore has no mappings', async () => {
        const CMD = `frodo secretstore mapping alias list -gi EnvironmentAndSystemPropertySecretStore -s am.services.httpclient.mtls.clientcert.testClientCert.secret -m classic`;
        await testFail(CMD, classicEnv)
    });
    test('"frodo secretstore mapping alias list --long --secretstore-id default-keystore --secretstore-type KeyStoreSecretStore --global --secret-id am.applications.agents.remote.consent.request.signing.ES256 --type classic": Should list the aliases for the global secret store mapping', async () => {
        const CMD = `frodo secretstore mapping alias list --long --secretstore-id default-keystore --secretstore-type KeyStoreSecretStore --global --secret-id am.applications.agents.remote.consent.request.signing.ES256 --type classic`;
        await testSuccess(CMD, classicEnv);
    });
});
