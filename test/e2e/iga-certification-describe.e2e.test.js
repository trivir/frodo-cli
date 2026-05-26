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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification describe -i 97863303-dea3-48bf-af77-cacfaf9328a3 -f test/e2e/exports/all/allCertifications.certification.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification describe --certification-id 97863303-dea3-48bf-af77-cacfaf9328a3
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification describe -n Sample\ Access\ Review
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification describe --certification-name phh-entitlement-assignment-certification --file test/e2e/exports/all/allCertifications.certification.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification describe -f test/e2e/exports/all/allCertifications.certification.json
 */
import { getEnv, testSuccess } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';


process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const allCertificationsFile = "test/e2e/exports/all/allCertifications.certification.json";

describe(`frodo iga certification describe`, () => {
  test(`"frodo iga certification describe -i 97863303-dea3-48bf-af77-cacfaf9328a3 -f ${allCertificationsFile}": should describe certification '97863303-dea3-48bf-af77-cacfaf9328a3' from file ${allCertificationsFile}`, async () => {
    const CMD = `frodo iga certification describe -i 97863303-dea3-48bf-af77-cacfaf9328a3 -f ${allCertificationsFile}`;
    testSuccess(CMD, igaEnv);
  });

  test(`"frodo iga certification describe --certification-id 97863303-dea3-48bf-af77-cacfaf9328a3": should describe certification '97863303-dea3-48bf-af77-cacfaf9328a3'`, async () => {
    const CMD = `frodo iga certification describe --certification-id 97863303-dea3-48bf-af77-cacfaf9328a3`;
    testSuccess(CMD, igaEnv);
  });

  test(`"frodo iga certification describe -n Sample\\ Access\\ Review": should describe certification named 'Sample Access Review'`, async () => {
    const CMD = `frodo iga certification describe -n Sample\\ Access\\ Review`;
    testSuccess(CMD, igaEnv);
  });

  test(`"frodo iga certification describe --certification-name phh-entitlement-assignment-certification": should describe certification named 'phh-entitlement-assignment-certification' from file ${allCertificationsFile}`, async () => {
    const CMD = `frodo iga certification describe --certification-name phh-entitlement-assignment-certification --file ${allCertificationsFile}`;
    testSuccess(CMD, igaEnv);
  });

  test(`"frodo iga certification describe -f ${allCertificationsFile}": should describe first certification from file ${allCertificationsFile}`, async () => {
    const CMD = `frodo iga certification describe -f ${allCertificationsFile}`;
    testSuccess(CMD, igaEnv);
  });
});
