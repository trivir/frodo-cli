import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo agent web delete', () => {

    test('"frodo agent web delete -i frodo-test-web-agent": should delete the web agent with id \'frodo-test-web-agent\'', async () => {
        const CMD = `frodo agent web delete -i frodo-test-web-agent`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent web delete --agent-id frodo-test-web-agent": should display error when the web agent with id \'frodo-test-web-agent\' cannot be deleted since it does not exist', async () => {
        const CMD = `frodo agent web delete --agent-id frodo-test-web-agent`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
        }
    });

    test('"frodo agent web delete -a": should delete all web agents', async () => {
        const CMD = `frodo agent web delete -a`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent web delete --all": should do nothing when no web agent can be deleted', async () => {
        const CMD = `frodo agent web delete --all`;
        const { stderr } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

});
