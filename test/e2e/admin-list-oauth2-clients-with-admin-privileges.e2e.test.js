import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo admin list-oauth2-clients-with-admin-privileges', () => {
    test('"frodo admin list-oauth2-clients-with-admin-privileges": should list the ids of the oauth2 clients with admin privileges.', async () => {
        const CMD = `frodo admin list-oauth2-clients-with-admin-privileges`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
