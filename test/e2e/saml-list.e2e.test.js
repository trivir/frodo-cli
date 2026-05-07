import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo saml list', () => {
    test('"frodo saml list": should list the ids of the saml entity providers', async () => {
        const CMD = `frodo saml list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo saml list -l": should list the ids, locations, and roles of the saml entity providers', async () => {
        const CMD = `frodo saml list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo saml list --long": should list the ids, locations, and roles of the saml entity providers', async () => {
        const CMD = `frodo saml list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
