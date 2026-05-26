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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import -i 855918e4-06c4-4393-b1da-61a20e23e29a -f test/e2e/exports/all/allCertifications.certification.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import --certification-id 855918e4-06c4-4393-b1da-61a20e23e29a --file test/e2e/exports/all/allCertifications.certification.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import -n Sample\ Access\ Review -f test/e2e/exports/all/allCertifications.certification.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import --certification-name phh-entitlement-assignment-certification --file test/e2e/exports/all/allCertifications.certification.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import -f test/e2e/exports/all/allCertifications.certification.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import -af test/e2e/exports/all/allCertifications.certification.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import --all --file test/e2e/exports/all/allCertifications.certification.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import -AD test/e2e/exports/all-separate/cloud/iga/certifications
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga certification import --all-separate --directory test/e2e/exports/all-separate/cloud/iga/certifications --no-deps
 */
import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const allDirectory = "test/e2e/exports/all";
const allCertificationsFileName = "allCertifications.certification.json";
const allCertificationsExport = `${allDirectory}/${allCertificationsFileName}`;
const allSeparateCertificationsDirectory = `test/e2e/exports/all-separate/cloud/iga/certifications`;

describe(`frodo iga certification import`, () => {
  test(`"frodo iga certification import -i 855918e4-06c4-4393-b1da-61a20e23e29a -f ${allCertificationsExport}": should import 855918e4-06c4-4393-b1da-61a20e23e29a from the file "${allCertificationsExport}" with dependencies`, async () => {
    const CMD = `frodo iga certification import -i 855918e4-06c4-4393-b1da-61a20e23e29a -f ${allCertificationsExport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import --certification-id 855918e4-06c4-4393-b1da-61a20e23e29a --file ${allCertificationsExport} --no-deps": should import 855918e4-06c4-4393-b1da-61a20e23e29a from the file "${allCertificationsExport}"`, async () => {
    const CMD = `frodo iga certification import --certification-id 855918e4-06c4-4393-b1da-61a20e23e29a --file ${allCertificationsExport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import -n Sample\\ Access\\ Review -f ${allCertificationsExport}": should import Sample Access Review from the file "${allCertificationsExport}" with dependencies`, async () => {
    const CMD = `frodo iga certification import -n Sample\\ Access\\ Review -f ${allCertificationsExport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import --certification-name phh-entitlement-assignment-certification --file ${allCertificationsExport} --no-deps": should import certification named "phh-entitlement-assignment-certification" from the file "${allCertificationsExport}"`, async () => {
    const CMD = `frodo iga certification import --certification-name phh-entitlement-assignment-certification --file ${allCertificationsExport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import -f ${allCertificationsExport} --no-deps": should import first certification from the file "${allCertificationsExport}"`, async () => {
    const CMD = `frodo iga certification import -f ${allCertificationsExport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import -af ${allCertificationsExport}": should import all certifications from the file "${allCertificationsExport}" with dependencies`, async () => {
    const CMD = `frodo iga certification import -af ${allCertificationsExport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import --all --file ${allCertificationsExport}": should import all certifications from the file "${allCertificationsExport} with dependencies"`, async () => {
    const CMD = `frodo iga certification import --all --file ${allCertificationsExport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import -AD ${allSeparateCertificationsDirectory}": should import all certifications from the directory "${allSeparateCertificationsDirectory}" with dependencies`, async () => {
    const CMD = `frodo iga certification import -AD ${allSeparateCertificationsDirectory}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga certification import --all-separate --directory ${allSeparateCertificationsDirectory} --no-deps": should import all certifications from the directory "${allSeparateCertificationsDirectory}"`, async () => {
    const CMD = `frodo iga certification import --all-separate --directory ${allSeparateCertificationsDirectory} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });
});
