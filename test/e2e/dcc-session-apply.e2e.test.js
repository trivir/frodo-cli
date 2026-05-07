import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo dcc session apply', () => {
    test('"frodo dcc session apply": should apply the configuration and end the current direct configuration session', async () => {
        const CMD = `frodo dcc session apply`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
        });

    test('"frodo dcc session apply --json": should apply the configuration and end the current direct configuration session in JSON format', async () => {
        const CMD = `frodo dcc session apply --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
