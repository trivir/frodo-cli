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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export -af test/e2e/exports/all-iga/allGlossaries.glossary.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export --all -If test/e2e/exports/all-iga/allGlossariesInternal.glossary.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export --glossary-id 980b0308-32c8-44a3-86a4-0098d82b33bd
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export -Nn sensitive -t entitlement
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export -NAID test/e2e/exports/all-separate/cloud/iga/glossaryByAccountType/ -t account
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export -NAD test/e2e/exports/all-separate/cloud/iga/glossary/
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga glossary export -aIMNt role -f test/e2e/exports/all-iga/allRoleTypeGlossaries.glossary.json
 */
import { getEnv, testExport } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const type = 'glossary';

describe(`frodo iga glossary export`, () => {
  test(`"frodo iga glossary export -af test/e2e/exports/all-iga/allGlossaries.glossary.json": should export all glossaries to file test/e2e/exports/all/allGlossaries.glossary.json`, async () => {
    const exportFile = "allGlossaries.glossary.json";
    const exportDirectory = "test/e2e/exports/all-iga/";
    const CMD = `frodo iga glossary export -af ${exportDirectory}${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, exportDirectory, true, true);
  });

  test(`"frodo iga glossary export --all -If test/e2e/exports/all-iga/allGlossariesInternal.glossary.json": should export all glossaries including internals to file test/e2e/exports/all/allGlossariesInternal.glossary.json`, async () => {
    const exportFile = "allGlossariesInternal.glossary.json";
    const exportDirectory = "test/e2e/exports/all-iga/";
    const CMD = `frodo iga glossary export --all -If ${exportDirectory}${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, exportDirectory, true, true);
  });

  test(`"frodo iga glossary export --glossary-id 980b0308-32c8-44a3-86a4-0098d82b33bd": should export the glossary with id "980b0308-32c8-44a3-86a4-0098d82b33bd"`, async () => {
    const CMD = `frodo iga glossary export --glossary-id 980b0308-32c8-44a3-86a4-0098d82b33bd`;
    await testExport(CMD, igaEnv, type, undefined, undefined, true, true);
  });

  test(`"frodo iga glossary export -Nn sensitive -t entitlement": should export the glossary named sensitive from the type entitlement without metadata`, async () => {
    const exportFile = "sensitive.glossary.json"
    const CMD = `frodo iga glossary export -Nn sensitive -t entitlement`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, false, true);
  });

  test(`"frodo iga glossary export -NAID test/e2e/exports/all-separate/cloud/iga/glossaryByAccountType/ -t account": should export all the glossaries including internals, separately with no metadata within the account type`, async () => {
    const exportDirectory = "test/e2e/exports/all-separate/cloud/iga/glossaryByAccountType/";
    const CMD = `frodo iga glossary export -NAID ${exportDirectory} -t account`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga glossary export -NAD test/e2e/exports/all-separate/cloud/iga/glossary/": should export all the glossaries separately with no metadata`, async () => {
    const exportDirectory = "test/e2e/exports/all-separate/cloud/iga/glossary/";
    const CMD = `frodo iga glossary export -NAD ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga glossary export -aIMNt role -f test/e2e/exports/all-iga/allRoleTypeGlossaries.glossary.json": should export all the glossaries including internals, modified properities and no metadata from the type role and save to file allRoleTypeGlossaries.glossary.json`, async () => {
    const exportFile = "allRoleTypeGlossaries.glossary.json";
    const exportDirectory = "test/e2e/exports/all-iga/"
    const CMD = `frodo iga glossary export -aIMNt role -f ${exportDirectory}${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, exportDirectory, false, true);
  });
});
