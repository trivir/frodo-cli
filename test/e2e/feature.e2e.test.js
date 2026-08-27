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
 *
 * 3. Validate your freshly recorded mock responses are complete and working.
 *    Re-run the exact command you want to test in mock mode (see step #1).
 *
 * 4. Write your test.
 *    Make sure to use the exact command including number of arguments and params.
 *
 * 5. Commit both your test and your new recordings to the repository.
 */

/*
To record, run against the live frodo-dev tenant (uses your local
'openam-frodo-dev.forgeblocks.com' connection profile automatically, since
getEnv() switches to FRODO_CONNECTION in recording mode):

FRODO_MOCK=record FRODO_NO_CACHE=1 npm run test:update -- e2e/feature

Deliberately covers only read-only verbs (list/describe/validate) against
"groups", a feature already installed on frodo-dev and present on virtually
every IDM tenant -- never `install`, which is irreversible on a shared
session tenant (per this session's own design decision when the command
was first built).
*/
import {
  assertNoPollyReplayError,
  execWithRecordingProgress,
  getEnv,
  isRecordingMode,
  logRecordingProgress,
  verifyAuth,
} from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
const isRecording = isRecordingMode();

const env = getEnv(c);

describe('frodo feature (list/describe/validate)', () => {
  beforeAll(async () => {
    if (isRecording) {
      logRecordingProgress('Verifying authentication before live feature run');
      await verifyAuth(env);
    }
  });

  test(`"frodo feature list": should list tenant-configuration features`, async () => {
    const CMD = `frodo feature list`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo feature describe -i groups": should describe the groups feature`, async () => {
    const CMD = `frodo feature describe -i groups`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo feature validate -i groups": should report already-installed as invalid to (re-)install`, async () => {
    const CMD = `frodo feature validate -i groups`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });
});
