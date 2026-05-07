import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo idm count', () => {
    test('"frodo idm count -o alpha_user": should count all alpha_users', async () => {
        const CMD = `frodo idm count -o alpha_user`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo idm count --managed-object alpha_user": should count all alpha_users', async () => {
        const CMD = `frodo idm count --managed-object alpha_user`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
