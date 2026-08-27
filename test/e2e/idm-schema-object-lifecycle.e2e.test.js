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

FRODO_MOCK=record FRODO_NO_CACHE=1 npm run test:update -- e2e/idm-schema-object-lifecycle

This is a single, strictly sequential lifecycle: each step's fixture/state is
created by the step before it, and the suite is self-cleaning (the final two
steps delete the property and the type it created). If any step fails while
recording against the live tenant, run:

  frodo idm schema object delete -o alpha_frodoE2ETestWidget -y -F <host>

to manually clean up before re-recording. 'object create' is flags-only
(-o/--title/--icon, no file) -- every command in this family takes -o
explicitly.

Two pairs of steps intentionally use different flags for what would
otherwise be the exact same command ('property describe' before vs. after
the update; the final 'property list' vs. the two earlier ones): Polly's
recording bucket is keyed by the literal command line, and two invocations
of the identical command line expecting genuinely different recorded
responses (e.g. a property definition before vs. after an update, or a 200
vs. a 404) do not reliably replay in order. Varying an
otherwise-inconsequential flag (--json) gives each its own bucket instead.

This test only exercises the 'frodo idm schema object [property]' commands
added for the tracker's managed-object schema CLI design -- it deliberately
does not create/delete a managed-object *record* of the new type, since no
'frodo' CLI command for managed-object records exists yet (verified
separately, outside this suite, via frodo-lib directly against the live
tenant).
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

const type = 'alpha_frodoE2ETestWidget';
const fixtureDir = 'test/e2e/test-data/idm-schema-object-lifecycle';
const propertyCreateFile = `${fixtureDir}/widgetSize.property.create.json`;
const propertyUpdateFile = `${fixtureDir}/widgetSize.property.update.json`;

async function cleanUp() {
  try {
    await execWithRecordingProgress(
      `frodo idm schema object delete -o ${type} -y -F`,
      env,
      false
    );
  } catch {
    // Best-effort: the type may already be gone if the suite completed
    // normally, or never got created if it failed before step 1.
  }
}

describe('frodo idm schema object lifecycle (create type -> add property -> update property -> remove property -> delete type)', () => {
  beforeAll(async () => {
    if (isRecording) {
      logRecordingProgress('Verifying authentication before live lifecycle run');
      await verifyAuth(env);
    }
  });

  afterAll(async () => {
    if (isRecording) {
      logRecordingProgress('Ensuring the live tenant has no leftover test type');
      await cleanUp();
    }
  });

  test(`"frodo idm schema object create -o ${type} --title 'Frodo E2E Test Widget' -y": should create the new managed-object type`, async () => {
    const CMD = `frodo idm schema object create -o ${type} --title "Frodo E2E Test Widget" -y`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property list -o ${type}": should list the new type's base properties`, async () => {
    const CMD = `frodo idm schema property list -o ${type}`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property create -o ${type} -p widgetSize -f ${propertyCreateFile}": should add a new schema property`, async () => {
    const CMD = `frodo idm schema property create -o ${type} -p widgetSize -f ${propertyCreateFile}`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property describe -o ${type} -p widgetSize": should describe the new property`, async () => {
    const CMD = `frodo idm schema property describe -o ${type} -p widgetSize`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property update -o ${type} -p widgetSize -f ${propertyUpdateFile} -y": should update the property, previewing current vs. proposed`, async () => {
    const CMD = `frodo idm schema property update -o ${type} -p widgetSize -f ${propertyUpdateFile} -y`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property describe -o ${type} -p widgetSize --json": should reflect the updated property definition`, async () => {
    const CMD = `frodo idm schema property describe -o ${type} -p widgetSize --json`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property delete -o ${type} -p widgetSize -y": should remove the property`, async () => {
    const CMD = `frodo idm schema property delete -o ${type} -p widgetSize -y`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property list -o ${type}": should be back to only the base properties`, async () => {
    const CMD = `frodo idm schema property list -o ${type}`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  // -F/--force is required here even though this test never creates a
  // record: IDM's record-count index can briefly report a stale non-zero
  // count right after schema operations on a type, especially one reused
  // across many recording/replay runs like this fixture's own type name --
  // confirmed live, not a bug in the delete command. A real operator hits
  // this exact situation and has to pass --force too, so this is the
  // realistic path to test, not a workaround.
  test(`"frodo idm schema object delete -o ${type} -y -F": should delete the managed-object type`, async () => {
    const CMD = `frodo idm schema object delete -o ${type} -y -F`;
    const { stdout, stderr } = await execWithRecordingProgress(CMD, env, isRecording);
    expect(assertNoPollyReplayError(stdout, CMD)).toMatchSnapshot();
    expect(assertNoPollyReplayError(stderr, CMD)).toMatchSnapshot();
  });

  test(`"frodo idm schema property list -o ${type} --json": should fail, the type no longer exists`, async () => {
    const CMD = `frodo idm schema property list -o ${type} --json`;
    try {
      await execWithRecordingProgress(CMD, env, isRecording);
      throw new Error('Command should have failed with non-zero exit code');
    } catch (e) {
      if (e.message === 'Command should have failed with non-zero exit code') {
        throw e;
      }
      expect(e.code).not.toBe(0);
      expect(assertNoPollyReplayError(e.stderr, CMD)).toMatchSnapshot();
    }
  });
});
