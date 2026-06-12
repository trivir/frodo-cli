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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export -Ni ae1381d5-cfad-4374-b3dc-075605b1036d -f testAllCerts.certifications.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export --certification-id f2284c72-ca2d-4eab-988e-93acf552b7eb --no-deps -Mf testCertsExportFile1.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export --no-metadata -a --directory testCertsExportDir2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export --all --no-deps -MN --file testCertsExportFile2.json 
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export -NAD testCertsExportDir3
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export --all-separate --no-deps -D testCertsExportDir4
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification export -Mn phh-entitlement-assignment-certification -f testCertsExportFile3.json
 */
import { getEnv, testExport } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const type = 'certification';

describe(`frodo iga certification export`, () => {
  test(`"frodo iga certification export -Ni ae1381d5-cfad-4374-b3dc-075605b1036d -f testAllCerts.certifications.json": should export certification 'ae1381d5-cfad-4374-b3dc-075605b1036d' with no metadata to a file`, async () => {
    const exportFile = "testAllCerts.certifications.json";
    const CMD = `frodo iga certification export -Ni ae1381d5-cfad-4374-b3dc-075605b1036d -f ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, false, true);
  });

  test(`"frodo iga certification export --certification-id f2284c72-ca2d-4eab-988e-93acf552b7eb --no-deps -Mf testCertsExportFile1.json": should export certification 'f2284c72-ca2d-4eab-988e-93acf552b7eb' with modified properties and no dependencies to a file`, async () => {
    const exportFile = 'testCertsExportFile1.json';
    const CMD = `frodo iga certification export --certification-id f2284c72-ca2d-4eab-988e-93acf552b7eb --no-deps -Mf ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, true, true);
  });

  test(`"frodo iga certification export --no-metadata -a --directory testCertsExportDir2": should export all certifications with no metadata to a directory`, async () => {
    const exportDirectory = "testCertsExportDir2";
    const CMD = `frodo iga certification export --no-metadata -a --directory ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga certification export --all --no-deps -MN --file testCertsExportFile2.json": should export all certifications including modified properties with no dependencies or metadata to a file`, async () => {
    const exportFile = 'testCertsExportFile2.json';
    const CMD = `frodo iga certification export --all --no-deps -MN --file ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, false, true);
  });

  test(`"frodo iga certification export -NAD testCertsExportDir3": should export all certifications separately with no metadata to a directory`, async () => {
    const exportDirectory = "testCertsExportDir3";
    const CMD = `frodo iga certification export -NAD ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga certification export --all-separate --no-deps -D testCertsExportDir4": should export all certifications separately with no dependencies to a directory`, async () => {
    const exportDirectory = "testCertsExportDir4";
    const CMD = `frodo iga certification export --all-separate --no-deps -D ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, true, true);
  });

  test(`"frodo iga certification export -Mn phh-entitlement-assignment-certification -f testCertsExportFile3.json": should export the certification named 'phh-entitlement-assignment-certification' including modified properties, and no metadata.`, async () => {
    const exportFile = "testCertsExportFile3.json";
    const CMD = `frodo iga certification export -Mn phh-entitlement-assignment-certification -f ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, true, true);
  });
});
