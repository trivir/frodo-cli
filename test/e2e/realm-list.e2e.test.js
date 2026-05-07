import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo realm list', () => {
    test('"frodo realm list": should list the names of the realms', async () => {
        const CMD = `frodo realm list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo realm list -l": should list the names, statuses, custom domains, and parents of the realms', async () => {
        const CMD = `frodo realm list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo realm list --long": should list the names, statuses, custom domains, and parents of the realms', async () => {
        const CMD = `frodo realm list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
