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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events export -Nxi 2dd3656c-c46d-4254-9959-91179227ed3e -D testEventExportDir1
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events export --event-id 2dd3656c-c46d-4254-9959-91179227ed3e --no-deps -f testEventExportFile1.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events export --no-metadata -a --directory testEventExportDir2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events export --all --no-deps --file testEventExportFile2.json 
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events export -xNAD testEventExportDir3
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events export --all-separate --no-deps -D testEventExportDir4
 */
import { getEnv, testExport } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

const type = 'event';

describe(`frodo iga events export`, () => {
  test(`"frodo iga events export -i 2dd3656c-c46d-4254-9959-91179227ed3e": should export event 'test_events_1' with extracted scripts and no metadata`, async () => {
    const exportDirectory = "testEventExportDir1";
    const CMD = `frodo iga events export -Nxi 2dd3656c-c46d-4254-9959-91179227ed3e -D ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga events export --event-id 2dd3656c-c46d-4254-9959-91179227ed3e --no-deps -f testEventExportFile1.json": should export event 'test_events_1' with no coordinates and no dependencies`, async () => {
    const exportFile = 'testEventExportFile1.json';
    const CMD = `frodo iga events export --event-id 2dd3656c-c46d-4254-9959-91179227ed3e --no-deps -f ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, true, true);
  });

  test(`"frodo iga events export --no-metadata -a --directory testEventExportDir2": should export all events with no metadata`, async () => {
    const exportFile = 'allEvents.event.json';
    const exportDirectory = "testEventExportDir2";
    const CMD = `frodo iga events export --no-metadata -a --directory ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, exportFile, exportDirectory, false, true);
  });

  test(`"frodo iga events export --all --no-deps --file testEventExportFile2.json": should export all events including non-mutable ones with no dependencies`, async () => {
    const exportFile = 'testEventExportFile2.json';
    const CMD = `frodo iga events export --all --no-deps --file ${exportFile}`;
    await testExport(CMD, igaEnv, type, exportFile, undefined, true, true);
  });

  test(`"frodo iga events export -xNAD testEventExportDir3": should export all events separately with no metadata`, async () => {
    const exportDirectory = "testEventExportDir3";
    const CMD = `frodo iga events export -xNAD ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, false, true);
  });

  test(`"frodo iga events export --all-separate --no-deps -D testEventExportDir4": should export all events separately including non-mutable ones with no dependencies`, async () => {
    const exportDirectory = "testEventExportDir4";
    const CMD = `frodo iga events export --all-separate --no-deps -D ${exportDirectory}`;
    await testExport(CMD, igaEnv, type, undefined, exportDirectory, true, true);
  });
});
