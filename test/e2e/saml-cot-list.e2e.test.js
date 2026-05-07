import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo saml cot list', () => {
    test('"frodo saml cot list": should list the names of the circles of trust', async () => {
        const CMD = `frodo saml cot list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo saml cot list -l": should list the names, descriptions, status, and trusted providers of the circles of trust', async () => {
        const CMD = `frodo saml cot list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo saml cot list --long": should list the names, descriptions, status, and trusted providers of the circles of trust', async () => {
        const CMD = `frodo saml cot list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
