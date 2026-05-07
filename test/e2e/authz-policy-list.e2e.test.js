import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo authz policy list', () => {
    test('"frodo authz policy list": should list the ids of the authz policies', async () => {
        const CMD = `frodo authz policy list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy list -l": should list the ids, descriptions, and statuses of the authz policies', async () => {
        const CMD = `frodo authz policy list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy list --long": should list the ids, descriptions, and statuses of the authz policies', async () => {
        const CMD = `frodo authz policy list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy list --set-id test-policy-set": should list the ids of the authz policies in the test-policy-set set', async () => {
        const CMD = `frodo authz policy list --set-id test-policy-set`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy list -l --set-id test-policy-set": should list the ids, descriptions, and statuses of the authz policies in the test-policy-set set', async () => {
        const CMD = `frodo authz policy list -l --set-id test-policy-set`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy list --long --set-id test-policy-set": should list the ids, descriptions, and statuses of the authz policies in the test-policy-set set', async () => {
        const CMD = `frodo authz policy list --long --set-id test-policy-set`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
