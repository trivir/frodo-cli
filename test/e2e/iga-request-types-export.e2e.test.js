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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type export --request-type-name test_workflow_request_type_2 --no-deps -f testRequestTypeExportFile1.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type export --no-metadata -a --directory testRequestTypeExportDir2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type export --all --no-deps --use-string-arrays --file testRequestTypeExportFile2.json 
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type export -xNAD testRequestTypeExportDir3
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type export --all-separate --use-string-arrays --no-deps -D testRequestTypeExportDir4
 */
import { getEnv, testExport } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const type = 'requestType';

describe(`frodo iga request type export`, () => {
  test(`"frodo iga request-type export --request-type-name test_workflow_request_type_2  --no-deps -f testRequestTypeExportFile1.json": should export request type 'test' with no dependencies`, async () => {
    const exportFile = 'testRequestTypeExportFile1.json';
    const CMD = `frodo iga request-type export --request-type-name test_workflow_request_type_2  --no-deps -f ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, true, true);
  });

  test(`"frodo iga request-type export --no-metadata -a --directory testRequestTypeExportDir2": should export all request types with no metadata`, async () => {
    const exportFile = 'allRequestTypes.requestType.json';
    const exportDirectory = "testRequestTypeExportDir2";
    const CMD = `frodo iga request-type export --no-metadata -a --directory ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, exportFile, exportDirectory, false, true);
  });

  test(`"frodo iga request-type export --all --no-deps --use-string-arrays --file testRequestTypeExportFile2.json ": should export all request types with no dependencies`, async () => {
    const exportFile = 'testRequestTypeExportFile2.json';
    const CMD = `frodo iga request-type export --all --no-deps --use-string-arrays --file ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, true, true);
  });

  test(`"frodo iga request-type export -xNAD testRequestTypeExportDir3": should export all request types separately with no metadata`, async () => {
    const exportDirectory = "testRequestTypeExportDir3";
    const CMD = `frodo iga request-type export -xNAD ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga request-type export --all-separate --use-string-arrays --no-deps -D testRequestTypeExportDir4": should export all request types separately with no dependencies and using string arrays`, async () => {
    const exportDirectory = "testRequestTypeExportDir4";
    const CMD = `frodo iga request-type export --all-separate --use-string-arrays --no-deps -D ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, true, true);
  });
});