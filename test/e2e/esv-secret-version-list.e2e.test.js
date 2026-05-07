import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo esv secret version list', () => {
    test('"frodo esv secret version list -i esv-test-secret": should list the versions of the esv secret "esv-test-secret"', async () => {
        const CMD = `frodo esv secret version list -i esv-test-secret`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo esv secret version list --secret-id": should list the versions of the esv secret "esv-test-secret"', async () => {
        const CMD = `frodo esv secret version list --secret-id esv-test-secret`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
