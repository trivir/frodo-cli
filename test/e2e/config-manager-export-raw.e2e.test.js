/** See test/e2e/README.md for how to write and record e2e tests. */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager pull raw -D configManagerExportRawDir0 -f test/e2e/fr-config-manager-pull-config/raw.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager pull raw -D configManagerExportRawDir1 -p /environment/release
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager pull raw -of test/e2e/fr-config-manager-pull-config/raw.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager pull raw -D configManagerExportRawDir2 -xf test/e2e/fr-config-manager-pull-config/raw.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager pull raw -xof test/e2e/fr-config-manager-pull-config/raw.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager pull raw -xop /environment/release
*/
import { getEnv, testExport, testSuccess } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);

const configFile = 'test/e2e/fr-config-manager-pull-config/raw.json';

describe('frodo config-manager pull raw', () => {
    test('"frodo config-manager pull raw -D configManagerExportRawDir0 -f test/e2e/fr-config-manager-pull-config/raw.json": should export all the configs in the provided json file in fr-config manager style.', async () => {
        const dirName = 'configManagerExportRawDir0';
        const CMD = `frodo config-manager pull raw -D ${dirName} -f ${configFile}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull raw -D configManagerExportRawDir1 -p /environment/release": should export the configuration at the specified API path in fr-config-manager format.', async () => {
        const dirName = 'configManagerExportRawDir1';
        const CMD = `frodo config-manager pull raw -D ${dirName} -p /environment/release `;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull raw -of test/e2e/fr-config-manager-pull-config/raw.json": should output the configurations listed in the JSON file to stdout in fr-config-manager format.', async () => {
        const CMD = `frodo config-manager pull raw -of ${configFile}`;
        await testSuccess(CMD, env);
    });
    test('"frodo config-manager pull raw -D configManagerExportRawDir2 -xf test/e2e/fr-config-manager-pull-config/raw.json": should export all configurations listed in the JSON file in fr-config-manager format, preserving any push API versions.', async () => {
        const dirName = 'configManagerExportRawDir2';
        const CMD = `frodo config-manager pull raw -D ${dirName} -xf ${configFile}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull raw -xof test/e2e/fr-config-manager-pull-config/raw.json": should output all configurations listed in the JSON file to stdout in fr-config-manager format, preserving any push API versions.', async () => {
        const CMD = `frodo config-manager pull raw -xof ${configFile}`;
        await testSuccess(CMD, env);
    });
    test('"frodo config-manager pull raw -xop /environment/release": should output the configuration at the specified API path to stdout in fr-config-manager format.', async () => {
        const CMD = `frodo config-manager pull raw -xop /environment/release`;
        await testSuccess(CMD, env);
    });
});
