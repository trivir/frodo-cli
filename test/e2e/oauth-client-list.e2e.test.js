import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo oauth client list', () => {
    test('"frodo oauth client list": should list the ids of the oauth clients', async () => {
        const CMD = `frodo oauth client list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo oauth client list -l": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of the oauth clients', async () => {
        const CMD = `frodo oauth client list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo oauth client list --long": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of the oauth clients', async () => {
        const CMD = `frodo oauth client list --long`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
