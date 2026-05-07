import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaPoliciesFileName = "allAlphaPolicies.policy.authz.json";
const allAlphaPoliciesExport = `${allDirectory}/${allAlphaPoliciesFileName}`;
const allSeparatePoliciesSetsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/policy`;

describe('frodo authz policy import', () => {
    test(`"frodo authz policy import -i 'Test Policy' -f ${allAlphaPoliciesExport}": should import the policy with the id "Test Policy" from the file "${allAlphaPoliciesExport}"`, async () => {
        const CMD = `frodo authz policy import -i 'Test Policy' -f ${allAlphaPoliciesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import --policy-id 'Test Policy' --file ${allAlphaPoliciesExport} --set-id test-policy-set --no-deps --prereqs": should import the policy with the id "Test Policy" from the file "${allAlphaPoliciesExport}" with no dependencies`, async () => {
        const CMD = `frodo authz policy import --policy-id 'Test Policy' --file ${allAlphaPoliciesExport} --set-id test-policy-set --no-deps --prereqs`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import -i 'Test Policy' -f ${allAlphaPoliciesFileName} -D ${allDirectory}": should import the policy with the id "Test Policy" from the file "${allAlphaPoliciesExport}"`, async () => {
        const CMD = `frodo authz policy import -i 'Test Policy' -f ${allAlphaPoliciesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import -f ${allAlphaPoliciesExport}": should import the first policy from the file "${allAlphaPoliciesExport}"`, async () => {
        const CMD = `frodo authz policy import -f ${allAlphaPoliciesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import --file ${allAlphaPoliciesExport} --set-id test-policy-set --no-deps --prereqs": should import the first policy from the file "${allAlphaPoliciesExport}" with no dependencies`, async () => {
        const CMD = `frodo authz policy import --file ${allAlphaPoliciesExport} --set-id test-policy-set --no-deps --prereqs`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import -f ${allAlphaPoliciesFileName} -D ${allDirectory}": should import the first policy from the file "${allAlphaPoliciesExport}"`, async () => {
        const CMD = `frodo authz policy import -f ${allAlphaPoliciesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import -af ${allAlphaPoliciesExport}": should import all policies from the file "${allAlphaPoliciesExport}"`, async () => {
        const CMD = `frodo authz policy import -af ${allAlphaPoliciesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import --all --file ${allAlphaPoliciesExport} --set-id test-policy-set --no-deps --prereqs": should import all policies from the file "${allAlphaPoliciesExport}" with no dependencies`, async () => {
        const CMD = `frodo authz policy import --all --file ${allAlphaPoliciesExport} --set-id test-policy-set --no-deps --prereqs`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import -af ${allAlphaPoliciesFileName} -D ${allDirectory}": should import all policies from the file "${allAlphaPoliciesExport}"`, async () => {
        const CMD = `frodo authz policy import -af ${allAlphaPoliciesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import -AD ${allSeparatePoliciesSetsDirectory}": should import all policies from the ${allSeparatePoliciesSetsDirectory} directory"`, async () => {
        const CMD = `frodo authz policy import -AD ${allSeparatePoliciesSetsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authz policy import --all-separate --set-id test-policy-set --no-deps --prereqs --directory ${allSeparatePoliciesSetsDirectory}": should import all policies from the ${allSeparatePoliciesSetsDirectory} directory with no dependencies`, async () => {
        const CMD = `frodo authz policy import --all-separate --set-id test-policy-set --no-deps --prereqs --directory ${allSeparatePoliciesSetsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
