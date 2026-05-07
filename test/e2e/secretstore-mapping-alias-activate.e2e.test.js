import { getEnv, testFail, testSuccess } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo secretstore mapping alias activate', () => {
    test('"frodo secretstore mapping alias activate -i ESV -s am.services.httpclient.mtls.clientcert.testClientCert.secret -a esv-test-client-cert": Should activate the alias esv-test-client-cert', async () => {
        const CMD = `frodo secretstore mapping alias activate -i ESV -s am.services.httpclient.mtls.clientcert.testClientCert.secret -a esv-test-client-cert`;
        await testSuccess(CMD, env);
    });
    test('"frodo secretstore mapping alias activate -i ESV -t GoogleSecretManagerSecretStoreProvider -s am.services.httpclient.mtls.clientcert.testClientCert.secret -a esv-does-not-exist": Should fail when alias does not exist', async () => {
        const CMD = `frodo secretstore mapping alias activate -i ESV -t GoogleSecretManagerSecretStoreProvider -s am.services.httpclient.mtls.clientcert.testClientCert.secret -a esv-does-not-exist`;
        await testFail(CMD, env)
    });
    test('"frodo secretstore mapping alias activate -gi EnvironmentAndSystemPropertySecretStore -t EnvironmentAndSystemPropertySecretStore -s am.services.httpclient.mtls.clientcert.testClientCert.secret -a alias -m classic": should fail since EnvironmentAndSystemPropertySecretStore has no mappings', async () => {
        const CMD = `frodo secretstore mapping alias activate -gi EnvironmentAndSystemPropertySecretStore -t EnvironmentAndSystemPropertySecretStore -s am.services.httpclient.mtls.clientcert.testClientCert.secret -a alias -m classic`;
        await testFail(CMD, classicEnv)
    });
    test('"frodo secretstore mapping alias activate --secretstore-id default-keystore --secretstore-type KeyStoreSecretStore --global --secret-id am.applications.agents.remote.consent.request.signing.ES256 --alias es256test --type classic": Should activate the es256test alias on a global secretstore', async () => {
        const CMD = `frodo secretstore mapping alias activate --secretstore-id default-keystore --secretstore-type KeyStoreSecretStore --global --secret-id am.applications.agents.remote.consent.request.signing.ES256 --alias es256test --type classic`;
        await testSuccess(CMD, classicEnv);
    });
});
