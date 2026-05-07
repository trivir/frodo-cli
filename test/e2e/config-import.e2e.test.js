import cp from 'child_process';
import { promisify } from 'util';
import {
  getEnv,
  removeAnsiEscapeCodes
} from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);
const classicEnv = getEnv(cc);

const allDirectory = 'test/e2e/exports/all';
const allCloudFileName = 'all.cloud.json';
const allClassicFileName = 'all.classic.json';
const allCloudExport = `${allDirectory}/${allCloudFileName}`;
const allClassicExport = `${allDirectory}/${allClassicFileName}`;
const allSeparateCloudDirectory = `test/e2e/exports/all-separate/cloud`;
const allSeparateClassicDirectory = `test/e2e/exports/all-separate/classic`;

describe.skip('frodo config import', () => {
  test(`"frodo config import -adf ${allCloudExport}" Import everything from "${allCloudFileName}", including default scripts.`, async () => {
    const CMD = `frodo config import -adf ${allCloudExport}`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  // TODO: Fix test. Unable get test passing consistently, even after recording mocks (probably due to the re-uuid stuff). Skip for the meantime
  test.skip(`"frodo config import --all --clean --re-uuid-scripts --re-uuid-journeys --file ${allCloudExport}" Import everything from "${allCloudFileName}". Clean old services, and re-uuid journeys and scripts.`, async () => {
    const CMD = `frodo config import --all --clean --re-uuid-scripts --re-uuid-journeys --file ${allCloudExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo config import -aCf ${allCloudExport}" Import everything from "${allCloudFileName}". Clean old services`, async () => {
    const CMD = `frodo config import -aCf ${allCloudExport}`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  test(`"frodo config import -AD ${allSeparateCloudDirectory}" Import everything from directory "${allSeparateCloudDirectory}"`, async () => {
    const CMD = `frodo config import -AD ${allSeparateCloudDirectory}`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  // TODO: Fix test. Unable get test passing consistently, even after recording mocks (probably due to the re-uuid stuff). Skip for the meantime
  test.skip(`"frodo config import --all-separate --clean --re-uuid-scripts --re-uuid-journeys --directory ${allSeparateCloudDirectory}" Import everything from directory "${allSeparateCloudDirectory}". Clean old services, and re-uuid journeys and scripts.`, async () => {
    const CMD = `frodo config import --all-separate --clean --re-uuid-scripts --re-uuid-journeys --directory ${allSeparateCloudDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo config import -CAD ${allSeparateCloudDirectory}" Import everything from directory "${allSeparateCloudDirectory}". Clean old services`, async () => {
    const CMD = `frodo config import -CAD ${allSeparateCloudDirectory}`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  test(`"frodo config import --default -CAD ${allSeparateCloudDirectory}" Import everything from directory "${allSeparateCloudDirectory}", including default scripts. Clean old services`, async () => {
    const CMD = `frodo config import --default -CAD ${allSeparateCloudDirectory}`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  test(`"frodo config import -AD ${allSeparateCloudDirectory} --include-active-values" Import everything with secret values from directory "${allSeparateCloudDirectory}"`, async () => {
    const CMD = `frodo config import -AD ${allSeparateCloudDirectory} --include-active-values`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  test(`"frodo config import -gf test/e2e/exports/all-separate/cloud/global/sync/sync.idm.json" Import sync.idm.json along with extracted mappings and no errors`, async () => {
    const CMD = `frodo config import -gf test/e2e/exports/all-separate/cloud/global/sync/sync.idm.json`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo config import --file test/e2e/exports/all-separate/cloud/realm/root-alpha/script/mode.script.json" Import mode.script.json long with extracted scripts and no errors`, async () => {
    const CMD = `frodo config import --file test/e2e/exports/all-separate/cloud/realm/root-alpha/script/mode.script.json`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  // Classic Env Tests

  test.skip(`"frodo config import -adf ${allClassicExport} -m classic" Import everything from "${allClassicFileName}", including default scripts.`, async () => {
    const CMD = `frodo config import -adf ${allClassicExport} -m classic`;
    try {
      await exec(CMD, classicEnv);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  }, 300000);

  // TODO: Fix test. Unable get test passing consistently, even after recording mocks (probably due to the re-uuid stuff). Skip for the meantime
  test.skip(`"frodo config import --all --clean --re-uuid-scripts --re-uuid-journeys --include-active-values --file ${allClassicExport} --type classic" Import everything from "${allClassicFileName}". Clean old services, and re-uuid journeys and scripts.`, async () => {
    const CMD = `frodo config import --all --clean --re-uuid-scripts --re-uuid-journeys --include-active-values --file ${allClassicExport}--type classic`;
    const { stdout } = await exec(CMD, classicEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test.skip(`"frodo config import -AdD ${allSeparateClassicDirectory} -m classic" Import everything from directory "${allSeparateClassicDirectory}"`, async () => {
    const CMD = `frodo config import -AdD ${allSeparateClassicDirectory} -m classic`;
    try {
      await exec(CMD, classicEnv);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  }, 300000);

  // TODO: Fix test. Unable get test passing consistently, even after recording mocks (probably due to the re-uuid stuff). Skip for the meantime
  test.skip(`"frodo config import --all-separate --clean --re-uuid-scripts --re-uuid-journeys --include-active-values --directory ${allSeparateClassicDirectory} --type classic" Import everything from directory "${allSeparateClassicDirectory}". Clean old services, and re-uuid journeys and scripts.`, async () => {
    const CMD = `frodo config import --all-separate --clean --re-uuid-scripts --re-uuid-journeys --include-active-values --directory ${allSeparateClassicDirectory} --type classic`;
    const { stdout } = await exec(CMD, classicEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test.skip(`"frodo config import -gf test/e2e/exports/all-separate/classic/global/server/01.server.json -m classic" Import server 01 along with extracted properties and no errors`, async () => {
    const CMD = `frodo config import -gf test/e2e/exports/all-separate/classic/global/server/01.server.json -m classic`;
    const { stdout } = await exec(CMD, classicEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test.skip(`"frodo config import --global --file test/e2e/exports/all-separate/classic/global/authenticationModules/authPushReg.authenticationModules.json --type classic" Fail to import authentication module due to it being read only.`, async () => {
    const CMD = `frodo config import --global --file test/e2e/exports/all-separate/classic/global/authenticationModules/authPushReg.authenticationModules.json --type classic`;
    try {
      await exec(CMD, classicEnv);
      fail("Command should've failed");
    } catch (e) {
      // parallel test execution alters the progress bar output causing the snapshot to mismatch.
      // only workable solution I could find was to remove progress bar output altogether from such tests.
      expect(
        removeAnsiEscapeCodes(e.stderr)
      ).toMatchSnapshot();
    }
  });

  test.skip(`"frodo config import -f test/e2e/exports/all-separate/classic/realm/root/webhookService/Cool-Webhook.webhookService.json -m classic" Import the webhook service with no errors`, async () => {
    const CMD = `frodo config import -f test/e2e/exports/all-separate/classic/realm/root/webhookService/Cool-Webhook.webhookService.json -m classic`;
    const { stdout } = await exec(CMD, classicEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });
});
