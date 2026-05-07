import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo authz policy describe', () => {
    test('"frodo authz policy describe -i "Test Policy"": should describe the "Test Policy" policy', async () => {
        const CMD = `frodo authz policy describe -i "Test Policy"`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy describe --policy-id "Test Policy"": should describe the "Test Policy" policy', async () => {
        const CMD = `frodo authz policy describe --policy-id "Test Policy"`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz policy describe -i "Test Policy" --json": should describe the "Test Policy" policy in json', async () => {
        const CMD = `frodo authz policy describe -i "Test Policy" --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
