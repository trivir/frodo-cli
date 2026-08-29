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
// Cloud
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo idm schema object import -D test/e2e/exports/all-separate/cloud/global/idm/managed
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo idm schema object import -o -f test/e2e/exports/all-separate/cloud/global/idm/managed/alpha_user.managed.json
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo idm schema object import -f test/e2e/exports/all/all.managed.json
// Forgeops
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo idm schema object import -D test/e2e/exports/all-separate/forgeops/global/idm/managed -m forgeops
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo idm schema object import -f test/e2e/exports/all-separate/forgeops/global/idm/managed/managed.idm.json -m forgeops
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo idm schema object import -o -f test/e2e/exports/all-separate/forgeops/global/idm/managed/groovy/groovy.managed.json -m forgeops
*/
import { getEnv, testFail } from './utils/TestUtils';
import { connection as c , forgeops_connection as fc} from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);
const forgeopsEnv = getEnv(fc);

const managedObjectsExportDirectory =
  'test/e2e/exports/all-separate/cloud/global/idm/managed';
const forgeopsManagedObjectsExportDirectory =
  'test/e2e/exports/all-separate/forgeops/global/idm/managed';
const alphaUserFile = 'alpha_user.managed.json';
const allManagedPath = 'test/e2e/exports/all/all.managed.json';

// All of the fixtures below carry a schema for at least one managed-object
// type, so they now hit the schema-change confirmation gate added to
// 'frodo idm schema object import'. None of these commands pass -y/--yes,
// and these tests run non-interactively (no TTY), so the command is
// expected to correctly refuse and exit non-zero rather than hang or
// silently write a schema change — see idm-schema-object-import.ts.
// Passing -y would exercise the full successful-import path instead, but
// -y is itself a flag recorded into these fixtures' Polly recording name
// (see SetupPollyForFrodoLib.getFrodoArgsId), so doing that here would
// require fresh recordings from a live tenant, which these mocked tests
// don't have. That's tracked as follow-up work for whoever next has live
// tenant access, not something these tests can produce on their own.
describe('frodo idm import', () => {

  // Cloud Tests

  test(`"frodo idm schema object import -D ${managedObjectsExportDirectory}": should refuse to import the managed objects from the directory ${managedObjectsExportDirectory} without -y`, async () => {
    const CMD = `frodo idm schema object import -D ${managedObjectsExportDirectory}`;
    await testFail(CMD, env);
  });

  test(`"frodo idm schema object import -o -f ${managedObjectsExportDirectory}/${alphaUserFile}": should refuse to import just the alpha user managed object ${managedObjectsExportDirectory}/${alphaUserFile} without -y`, async () => {
    const CMD = `frodo idm schema object import -o -f ${managedObjectsExportDirectory}/${alphaUserFile}`;
    await testFail(CMD, env);
  });

  test(`"frodo idm schema object import -f ${allManagedPath}": should refuse to import all managed objects from a single file ${allManagedPath} without -y`, async () => {
    const CMD = `frodo idm schema object import -f ${allManagedPath}`;
    await testFail(CMD, env);
  });

  // Forgeops Tests

  test(`"frodo idm schema object import -D ${forgeopsManagedObjectsExportDirectory} -m forgeops": should refuse to import the managed objects from the directory '${forgeopsManagedObjectsExportDirectory}' without -y.`, async () => {
    const CMD = `frodo idm schema object import -D ${forgeopsManagedObjectsExportDirectory} -m forgeops`;
    await testFail(CMD, forgeopsEnv);
  });

  test(`"frodo idm schema object import -f ${forgeopsManagedObjectsExportDirectory}/managed.idm.json -m forgeops": should refuse to import the managed objects from a single file '${forgeopsManagedObjectsExportDirectory}/managed.idm.json' without -y`, async () => {
    const CMD = `frodo idm schema object import -f ${forgeopsManagedObjectsExportDirectory}/managed.idm.json -m forgeops`;
    await testFail(CMD, forgeopsEnv);
  });

  test(`"frodo idm schema object import -o -f ${forgeopsManagedObjectsExportDirectory}/groovy/groovy.managed.json -m forgeops": should refuse to import just the groovy managed object from '${forgeopsManagedObjectsExportDirectory}/groovy/groovy.managed.json' without -y.`, async () => {
    const CMD = `frodo idm schema object import -o -f ${forgeopsManagedObjectsExportDirectory}/groovy/groovy.managed.json -m forgeops`;
    await testFail(CMD, forgeopsEnv);
  });
});
