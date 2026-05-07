import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo agent java delete', () => {

    test('"frodo agent java delete -i frodo-test-java-agent": should delete the java agent with id \'frodo-test-java-agent\'', async () => {
        const CMD = `frodo agent java delete -i frodo-test-java-agent`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent java delete --agent-id frodo-test-java-agent": should display error when the java agent with id \'frodo-test-java-agent\' cannot be deleted since it does not exist', async () => {
        const CMD = `frodo agent java delete --agent-id frodo-test-java-agent`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
        }
    });

    test('"frodo agent java delete -a": should delete all java agents', async () => {
        const CMD = `frodo agent java delete -a`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent java delete --all": should do nothing when no java agent can be deleted since none exist', async () => {
        const CMD = `frodo agent java delete --all`;
        const { stderr } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

});
