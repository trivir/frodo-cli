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
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export --variable-id esv-test-var
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export -i esv-test-var -f my-esv-test-var.variable.json --no-decode
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export -SNi esv-test-var -D variableExportTestDir1
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export --all
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export -a --file my-allAlphaVariables.variable.json --no-decode
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export -SNaD variableExportTestDir2
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export -A
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo esv variable export --all-separate --sort --no-metadata --directory variableExportTestDir3 --no-decode
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

const type = 'variable';

describe('frodo esv variable export', () => {
    test('"frodo esv variable export --variable-id esv-test-var": should export the variable with variable id "esv-test-var"', async () => {
        const exportFile = "esv-test-var.variable.json";
        const CMD = `frodo esv variable export --variable-id esv-test-var`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -i esv-test-var -f my-esv-test-var.variable.json --no-decode": should export the variable with variable id "esv-test-var" into file named my-esv-test-var.variable.json', async () => {
        const exportFile = "my-esv-test-var.variable.json";
        const CMD = `frodo esv variable export -i esv-test-var -f ${exportFile} --no-decode`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -SNi esv-test-var -D variableExportTestDir1": should export the variable with variable id "esv-test-var" into the directory named variableExportTestDir1', async () => {
        const exportDirectory = "variableExportTestDir1";
        const CMD = `frodo esv variable export -SNi esv-test-var -D ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo esv variable export --all": should export all variables to a single file', async () => {
        const exportFile = "allAlphaVariables.variable.json";
        const CMD = `frodo esv variable export --all`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -a --file my-allAlphaVariables.variable.json --no-decode": should export all variables to a single file named my-allAlphaVariables.variable.json', async () => {
        const exportFile = "my-allAlphaVariables.variable.json";
        const CMD = `frodo esv variable export -a --file ${exportFile} --no-decode`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -SNaD variableExportTestDir2": should export all variables to a single file in the directory variableExportTestDir2', async () => {
        const exportDirectory = "variableExportTestDir2";
        const CMD = `frodo esv variable export -SNaD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo esv variable export -A": should export all variables to separate files', async () => {
        const CMD = `frodo esv variable export -A`;
        await testExport(CMD, env, type);
    });

    test('"frodo esv variable export --all-separate --sort --no-metadata --directory variableExportTestDir3 --no-decode": should export all variables to separate files in the directory variableExportTestDir3', async () => {
        const exportDirectory = "variableExportTestDir3";
        const CMD = `frodo esv variable export --all-separate --sort --no-metadata --directory ${exportDirectory} --no-decode`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });
});
