import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo journey enable', () => {
    test('"frodo journey enable -i j10": should enable the journey with id "j10"', async () => {
        const CMD = `frodo journey enable -i j10`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo journey enable --journey-id j10": should do nothing special when enabling the journey with id "j10" when it is already enabled', async () => {
        const CMD = `frodo journey enable --journey-id j10`;
        const { stderr } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });
});
