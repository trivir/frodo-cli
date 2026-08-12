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
FORGEOPS
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -i 'test-policy-set' -f test/e2e/exports/all/forgeopsAllPolicySets.policyset.authz.json --force-push
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import --set-id 'test-policy-set' --file test/e2e/exports/all/forgeopsAllPolicySets.policyset.authz.json --no-deps --prereqs
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -i 'test-policy-set' -f forgeopsAllPolicySets.policyset.authz.json -D test/e2e/exports/all
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -f test/e2e/exports/all/forgeopsAllPolicySets.policyset.authz.json --force-push
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import --file test/e2e/exports/all/forgeopsAllPolicySets.policyset.authz.json --no-deps --prereqs
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -f forgeopsAllPolicySets.policyset.authz.json -D test/e2e/exports/all
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -af test/e2e/exports/all/forgeopsAllPolicySets.policyset.authz.json --force-push
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import --all --file test/e2e/exports/all/forgeopsAllPolicySets.policyset.authz.json --no-deps --prereqs
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -af forgeopsAllPolicySets.policyset.authz.json -D test/e2e/exports/all
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import -AD test/e2e/exports/forgeops-authz-prereqs/policy-set-prereqs --force-push
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo authz set import --all-separate --no-deps --prereqs --directory test/e2e/exports/forgeops-authz-prereqs/policy-set-prereqs
*/
import cp from 'child_process';
import { promisify } from 'util';
import { getEnv } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(fc);

const allDirectory = "test/e2e/exports/all";
const allPolicySetsFileName = "forgeopsAllPolicySets.policyset.authz.json";
const allPolicySetsExport = `${allDirectory}/${allPolicySetsFileName}`;
const allSeparatePolicySetsDirectory = `test/e2e/exports/forgeops-authz-prereqs/policy-set-prereqs`;

describe('frodo authz set import', () => {
    test(`"frodo authz set import -i 'test-policy-set' -f ${allPolicySetsExport} --force-push": should import the policy set with the id "test-policy-set" from the file "${allPolicySetsExport}"`, async () => {
        const CMD = `frodo authz set import -i 'test-policy-set' -f ${allPolicySetsExport} --force-push`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import --set-id 'test-policy-set' --file ${allPolicySetsExport} --no-deps --prereqs": should import the policy set with the id "test-policy-set" from the file "${allPolicySetsExport}" with no dependencies`, async () => {
        const CMD = `frodo authz set import --set-id 'test-policy-set' --file ${allPolicySetsExport} --no-deps --prereqs`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import -i 'test-policy-set' -f ${allPolicySetsFileName} -D ${allDirectory}": should import the policy set with the id "test-policy-set" from the file "${allPolicySetsExport}"`, async () => {
        const CMD = `frodo authz set import -i 'test-policy-set' -f ${allPolicySetsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import -f ${allPolicySetsExport} --force-push": should import the first policy set from the file "${allPolicySetsExport}"`, async () => {
        const CMD = `frodo authz set import -f ${allPolicySetsExport} --force-push`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import --file ${allPolicySetsExport} --no-deps --prereqs": should import the first policy set from the file "${allPolicySetsExport}" with no dependencies`, async () => {
        const CMD = `frodo authz set import --file ${allPolicySetsExport} --no-deps --prereqs`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import -f ${allPolicySetsFileName} -D ${allDirectory}": should import the first policy set from the file "${allPolicySetsExport}"`, async () => {
        const CMD = `frodo authz set import -f ${allPolicySetsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import -af ${allPolicySetsExport} --force-push": should import all policy sets from the file "${allPolicySetsExport}"`, async () => {
        const CMD = `frodo authz set import -af ${allPolicySetsExport} --force-push`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import --all --file ${allPolicySetsExport} --no-deps --prereqs": should import all policy sets from the file "${allPolicySetsExport}" with no dependencies`, async () => {
        const CMD = `frodo authz set import --all --file ${allPolicySetsExport} --no-deps --prereqs`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import -af ${allPolicySetsFileName} -D ${allDirectory}": should import all policy sets from the file "${allPolicySetsExport}"`, async () => {
        const CMD = `frodo authz set import -af ${allPolicySetsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import -AD ${allSeparatePolicySetsDirectory} --force-push": should import all policy sets from the ${allSeparatePolicySetsDirectory} directory"`, async () => {
        const CMD = `frodo authz set import -AD ${allSeparatePolicySetsDirectory} --force-push`;
        const { stdout } = await exec(CMD, env);
        expect(stdout).toMatchSnapshot()
    });

    test(`"frodo authz set import --all-separate --no-deps --prereqs --directory ${allSeparatePolicySetsDirectory}": should fail when prerequisite resource type definitions are not included in the separate export files`, async () => {
        const CMD = `frodo authz set import --all-separate --no-deps --prereqs --directory ${allSeparatePolicySetsDirectory}`;
        try {
            await exec(CMD, env);
            fail("Command should've failed");
        } catch (e) {
            expect(e.stderr).toMatchSnapshot();
        }
    });

});
