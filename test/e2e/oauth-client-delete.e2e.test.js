import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes} from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const type = 'oauth2.app';

describe('frodo oauth client delete -i testapp', () => {
    test('"frodo oauth client delete -i testapp": should delete the oauth client with oauth client id "testapp"', async () => {
        const CMD = `frodo oauth client delete -i testapp`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
