/**
 * Follow this process to write e2e tests for the CLI project:
 *
 * 1. Test if all the necessary mocks for your tests already exist.
 *    In mock mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=1 frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    If your command completes without errors and with the expected results,
 *    all the required mocks already exist and you are good to write your
 *    test and skip to step #4.
 *
 *    If, however, your command fails and you see errors like the one below,
 *    you know you need to record the mock responses first:
 *
 *    [Polly] [adapter:node-http] Recording for the following request is not found and `recordIfMissing` is `false`.
 *
 * 2. Record mock responses for your exact command.
 *    In mock record mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=record frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    Wait until you see all the Polly instances (mock recording adapters) have
 *    shutdown before you try to run step #1 again.
 *    Messages like these indicate mock recording adapters shutting down:
 *
 *    Polly instance 'conn/4' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 2s...
 *    Polly instance 'conn/save/3' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 1s...
 *    Polly instance 'conn/save/3' stopping in 2s...
 *    Polly instance 'conn/4' stopped.
 *    Polly instance 'conn/save/3' stopping in 1s...
 *    Polly instance 'conn/save/3' stopped.
 *
 * 3. Validate your freshly recorded mock responses are complete and working.
 *    Re-run the exact command you want to test in mock mode (see step #1).
 *
 * 4. Write your test.
 *    Make sure to use the exact command including number of arguments and params.
 *
 * 5. Commit both your test and your new recordings to the repository.
 *    Your tests are likely going to reside outside the frodo-lib project but
 *    the recordings must be committed to the frodo-lib project.
 */

/*
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export --secret-id esv-test-secret
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export -i esv-test-secret -f my-esv-test-secret.secret.json
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export -SNi esv-test-secret -D secretExportTestDir1
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export --all
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export -a --file my-allAlphaSecrets.secret.json
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export -SNaD secretExportTestDir2
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export -A
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv secret export --all-separate --sort --no-metadata --directory secretExportTestDir3
*/
import { testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = {
    env: process.env,
};
env.env.FRODO_HOST = c.host;
env.env.FRODO_SA_ID = c.saId;
env.env.FRODO_SA_JWK = c.saJwk;

const type = 'secret';

describe('frodo esv secret export', () => {
    test('"frodo esv secret export --secret-id esv-test-secret": should export the secret with secret id "esv-test-secret"', async () => {
        const exportFile = "esv-test-secret.secret.json";
        const CMD = `frodo esv secret export --secret-id esv-test-secret`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv secret export -i esv-test-secret -f my-esv-test-secret.secret.json": should export the secret with secret id "esv-test-secret" into file named my-esv-test-secret.secret.json', async () => {
        const exportFile = "my-esv-test-secret.secret.json";
        const CMD = `frodo esv secret export -i esv-test-secret -f ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv secret export -SNi esv-test-secret -D secretExportTestDir1": should export the secret with secret id "esv-test-secret" into the directory named secretExportTestDir1', async () => {
        const exportDirectory = "secretExportTestDir1";
        const CMD = `frodo esv secret export -SNi esv-test-secret -D ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo esv secret export --all": should export all secrets to a single file', async () => {
        const exportFile = "allAlphaSecrets.secret.json";
        const CMD = `frodo esv secret export --all`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv secret export -a --file my-allAlphaSecrets.secret.json": should export all secrets to a single file named my-allAlphaSecrets.secret.json', async () => {
        const exportFile = "my-allAlphaSecrets.secret.json";
        const CMD = `frodo esv secret export -a --file ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv secret export -SNaD secretExportTestDir2": should export all secrets to a single file in the directory secretExportTestDir2', async () => {
        const exportDirectory = "secretExportTestDir2";
        const CMD = `frodo esv secret export -SNaD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo esv secret export -A": should export all secrets to separate files', async () => {
        const CMD = `frodo esv secret export -A`;
        await testExport(CMD, env, type);
    });

    test('"frodo esv secret export --all-separate --sort --no-metadata --directory secretExportTestDir3": should export all secrets to separate files in the directory secretExportTestDir3', async () => {
        const exportDirectory = "secretExportTestDir3";
        const CMD = `frodo esv secret export --all-separate --sort --no-metadata --directory ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });
});
