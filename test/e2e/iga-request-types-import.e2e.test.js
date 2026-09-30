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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import -n test_workflow_request_type_1 -f test/e2e/exports/all/allRequestTypes.requestType.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import --request-type-name test_workflow_request_type_1 --file test/e2e/exports/all/allRequestTypes.requestType.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import -f test/e2e/exports/all/allRequestTypes.requestType.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import -af test/e2e/exports/all/allRequestTypes.requestType.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import --all --file test/e2e/exports/all/allRequestTypes.requestType.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import -AD test/e2e/exports/all-separate/iga/global/request-type
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga request-type import --all-separate --directory test/e2e/exports/all-separate/iga/global/request-type --no-deps
 */
import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const allDirectory = "test/e2e/exports/all";
const allRequestTypesFileName = "allRequestTypes.requestType.json";
const allRequestTypesImport = `${allDirectory}/${allRequestTypesFileName}`;
const allSeparateRequestTypesDirectory = `test/e2e/exports/all-separate/iga/global/request-type`;

describe(`frodo iga request-type import`, () => {
  test(`"frodo iga request-type import -n test_workflow_request_type_1 -f ${allRequestTypesImport}": should import test_workflow_request_type_1 from the file "${allRequestTypesImport}" with dependencies`, async () => {
    const CMD = `frodo iga request-type import -n test_workflow_request_type_1 -f ${allRequestTypesImport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga request-type import --request-type-name test_workflow_request_type_1 --file ${allRequestTypesImport} --no-deps": should import test_workflow_request_type_1 from the file "${allRequestTypesImport}"`, async () => {
    const CMD = `frodo iga request-type import --request-type-name test_workflow_request_type_1 --file ${allRequestTypesImport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga request-type import -f ${allRequestTypesImport} --no-deps": should import first request type from the file "${allRequestTypesImport}"`, async () => {
    const CMD = `frodo iga request-type import -f ${allRequestTypesImport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga request-type import -af ${allRequestTypesImport}": should import all request-type from the file "${allRequestTypesImport}" with dependencies`, async () => {
    const CMD = `frodo iga request-type import -af ${allRequestTypesImport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga request-type import --all --file ${allRequestTypesImport} --no-deps": should import all request type from the file "${allRequestTypesImport}"`, async () => {
    const CMD = `frodo iga request-type import --all --file ${allRequestTypesImport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga request-type import -AD ${allSeparateRequestTypesDirectory}": should import all request types from the directory "${allSeparateRequestTypesDirectory}" with dependencies`, async () => {
    const CMD = `frodo iga request-type import -AD ${allSeparateRequestTypesDirectory}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga request-type import --all-separate --directory ${allSeparateRequestTypesDirectory} --no-deps": should import all request type from the directory "${allSeparateRequestTypesDirectory}"`, async () => {
    const CMD = `frodo iga request-type import --all-separate --directory ${allSeparateRequestTypesDirectory} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });
});