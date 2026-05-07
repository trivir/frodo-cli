import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo agent delete', () => {

    test('"frodo agent delete -i frodo-test-ig-agent": should delete the agent with id \'frodo-test-ig-agent\'', async () => {
        const CMD = `frodo agent delete -i frodo-test-ig-agent`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent delete --agent-id frodo-test-ig-agent": should display error when the agent with id \'frodo-test-ig-agent\' cannot be deleted since it does not exist', async () => {
        const CMD = `frodo agent delete --agent-id frodo-test-ig-agent`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
        }
    });

    test('"frodo agent delete -a": should delete all agents', async () => {
        const CMD = `frodo agent delete -a`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent delete --all": should do nothing when no agents can be deleted', async () => {
        const CMD = `frodo agent delete --all`;
        const { stderr } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

});
