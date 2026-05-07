import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo mapping list', () => {
    test('"frodo mapping list": should list the ids of the mappings', async () => {
        const CMD = `frodo mapping list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo mapping list -l": should list the ids, display names, sources/targets, and other info of the mappings', async () => {
        const CMD = `frodo mapping list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo mapping list --long": should list the ids, display names, sources/targets, and other info of the mappings', async () => {
        const CMD = `frodo mapping list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
