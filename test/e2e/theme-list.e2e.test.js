import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo theme list', () => {
    test('"frodo theme list": should list the names of the themes', async () => {
        const CMD = `frodo theme list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo theme list -l": should list the names, ids, and default status of the themes', async () => {
        const CMD = `frodo theme list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo theme list --long": should list the names, ids, and default status of the themes', async () => {
        const CMD = `frodo theme list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
