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
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import -i 2dd3656c-c46d-4254-9959-91179227ed3e -f test/e2e/exports/all/allEvents.event.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import --event-id 2dd3656c-c46d-4254-9959-91179227ed3e --file test/e2e/exports/all/allEvents.event.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import -f test/e2e/exports/all/allEvents.event.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import -af test/e2e/exports/all/allEvents.event.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import --all --file test/e2e/exports/all/allEvents.event.json --no-deps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import -AD test/e2e/exports/all-separate/cloud/global/events
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga events import --all-separate --directory test/e2e/exports/all-separate/cloud/global/events --no-deps
 */
import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

// Even though imports succeeds with a large amount of events being imported, the recording fails. This is to test a smaller subset of events
const allDirectory = "test/e2e/exports/all/import_events";
const allEventsFileName = "allEvents.event.json";
const allEventsExport = `${allDirectory}/${allEventsFileName}`;
const allSeparateEventsDirectory = `test/e2e/exports/all-separate/cloud/global/events`;

describe(`frodo iga events import`, () => {
  test(`"frodo iga events import -i 2dd3656c-c46d-4254-9959-91179227ed3e -f ${allEventsExport}": should import test_events_1 from the file "${allEventsExport}" with dependencies`, async () => {
    const CMD = `frodo iga events import -i 2dd3656c-c46d-4254-9959-91179227ed3e -f ${allEventsExport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga events import --event-id 2dd3656c-c46d-4254-9959-91179227ed3e --file ${allEventsExport} --no-deps": should import test_events_1 from the file "${allEventsExport}"`, async () => {
    const CMD = `frodo iga events import --event-id 2dd3656c-c46d-4254-9959-91179227ed3e --file ${allEventsExport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga events import -f ${allEventsExport} --no-deps": should import first event from the file "${allEventsExport}"`, async () => {
    const CMD = `frodo iga events import -f ${allEventsExport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga events import -af ${allEventsExport}": should import all events from the file "${allEventsExport}" with dependencies`, async () => {
    const CMD = `frodo iga events import -af ${allEventsExport}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga events import --all --file ${allEventsExport} --no-deps": should import all events from the file "${allEventsExport}"`, async () => {
    const CMD = `frodo iga events import --all --file ${allEventsExport} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga events import -AD ${allSeparateEventsDirectory}": should import all events from the directory "${allSeparateEventsDirectory}" with dependencies`, async () => {
    const CMD = `frodo iga events import -AD ${allSeparateEventsDirectory}`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga events import --all-separate --directory ${allSeparateEventsDirectory} --no-deps": should import all events from the directory "${allSeparateEventsDirectory}"`, async () => {
    const CMD = `frodo iga events import --all-separate --directory ${allSeparateEventsDirectory} --no-deps`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });
});
