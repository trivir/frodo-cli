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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe -i 11fee6b2-bf06-4560-b2ae-3e27cec169f2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe -n riskScore
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe --glossary-name riskLevel
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe -n sensitive -t role
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe --glossary-name sensitive --glossary-type application
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe -f test/e2e/exports/all/allGlossaries.glossary.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary describe --glossary-name sensitive --glossary-type entitlement --file test/e2e/exports/all/allGlossaries.glossary.json
 */

import { getEnv, testSuccess, testFail } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const allGlossariesFile = "test/e2e/exports/all/allGlossaries.glossary.json";

describe(`frodo iga glossary describe`, () => {
  test(`"frodo iga glossary describe -i 11fee6b2-bf06-4560-b2ae-3e27cec169f2": should describe the glossary with id: '11fee6b2-bf06-4560-b2ae-3e27cec169f2'`, async () => {
    const CMD = `frodo iga glossary describe -i 11fee6b2-bf06-4560-b2ae-3e27cec169f2`;
    await testSuccess(CMD, igaEnv)
  });

  test(`"frodo iga glossary describe -n riskScore": should describe the glossary named riskScore`, async () => {
    const CMD = `frodo iga glossary describe -n riskScore`;
    await testSuccess(CMD, igaEnv)
  });

  test(`"frodo iga glossary describe frodo iga glossary describe --glossary-name riskLevel": should describe the glossary named riskLevel`, async () => {
    const CMD = `frodo iga glossary describe --glossary-name riskLevel`;
    await testSuccess(CMD, igaEnv)
  });

  test(`"frodo iga glossary describe frodo iga glossary describe -n sensitive -t role": should describe the glossary named sensitive with objectType role`, async () => {
    const CMD = `frodo iga glossary describe -n sensitive -t role`;
    await testSuccess(CMD, igaEnv)
  });

  test(`"frodo iga glossary describe frodo iga glossary describe --glossary-name sensitive --glossary-type application": should describe the glossary named sensitive with objectType application`, async () => {
    const CMD = `frodo iga glossary describe --glossary-name sensitive --glossary-type application`;
    await testSuccess(CMD, igaEnv)
  });

  test(`"frodo iga glossary describe frodo iga glossary describe -f ${allGlossariesFile}": should describe the first glossary of the provided file ${allGlossariesFile} without id or name provided`, async () => {
    const CMD = `frodo iga glossary describe -f ${allGlossariesFile}`;
    await testSuccess(CMD, igaEnv)
  });

  test(`"frodo iga glossary describe frodo iga glossary describe --glossary-name sensitive --glossary-type entitlement --file ${allGlossariesFile}": should describe the glossary named sensitive with objectType entitlement from ${allGlossariesFile}`, async () => {
    const CMD = `frodo iga glossary describe --glossary-name sensitive --glossary-type entitlement --file ${allGlossariesFile}`;
    await testSuccess(CMD, igaEnv)
  });

});
