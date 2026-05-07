import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo journey disable', () => {
    test('"frodo journey disable -i j10": should disable the journey with id "j10"', async () => {
        const CMD = `frodo journey disable -i j10`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo journey disable --journey-id j10": should do nothing special when disabling the journey with id "j10" when it is already disabled', async () => {
        const CMD = `frodo journey disable --journey-id j10`;
        const { stderr } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });
});
