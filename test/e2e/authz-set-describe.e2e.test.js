import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo authz set describe', () => {
    test('"frodo authz set describe -i test-policy-set": should describe the test-policy-set set', async () => {
        const CMD = `frodo authz set describe -i test-policy-set`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz set describe --set-id test-policy-set": should describe the test-policy-set set', async () => {
        const CMD = `frodo authz set describe --set-id test-policy-set`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz set describe -i test-policy-set --json": should describe the test-policy-set set in json', async () => {
        const CMD = `frodo authz set describe -i test-policy-set --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
