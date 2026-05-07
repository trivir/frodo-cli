import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo agent gateway list', () => {
    test('"frodo agent gateway list": should list the ids of the gateway agents', async () => {
        const CMD = `frodo agent gateway list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent gateway list -l": should list the ids and statuses of the gateway agents', async () => {
        const CMD = `frodo agent gateway list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent gateway list --long": should list the ids and statuses of the gateway agents', async () => {
        const CMD = `frodo agent gateway list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
