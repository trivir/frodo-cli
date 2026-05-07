import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo dcc session init', () => {
    test('"frodo dcc session init": should initialize a new direct configuration session', async () => {
        const CMD = `frodo dcc session init`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo dcc session init --json": should initialize a new direct configuration session in JSON format', async () => {
        const CMD = `frodo dcc session init --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
