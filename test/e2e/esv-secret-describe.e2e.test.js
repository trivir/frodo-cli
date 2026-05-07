import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allConfigFile = 'test/e2e/exports/all/all.cloud.json';
const allConfigDirectory = 'test/e2e/exports/all-separate/cloud';

describe('frodo esv secret describe', () => {
    test(`"frodo esv secret describe -i esv-test-secret": should describe the esv secret "esv-test-secret"`, async () => {
        const CMD = `frodo esv secret describe -i esv-test-secret`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret describe -ui esv-test-secret-pi": should describe the esv secret "esv-test-secret-pi" with usage`, async () => {
        const CMD = `frodo esv secret describe -ui esv-test-secret-pi`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
            expect(removeAnsiEscapeCodes(e.stdout)).toMatchSnapshot();
        }
    });

    test(`"frodo esv secret describe -ui esv-test-secret-pi -f ${allConfigFile}": should describe the esv secret "esv-test-secret-pi" with usage from file ${allConfigFile}`, async () => {
        const CMD = `frodo esv secret describe -ui esv-test-secret-pi -f ${allConfigFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret describe -ui esv-test-secret-pi -D ${allConfigDirectory}": should describe the esv secret "esv-test-secret-pi" with usage from directory ${allConfigDirectory}`, async () => {
        const CMD = `frodo esv secret describe -ui esv-test-secret-pi -D ${allConfigDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret describe --json --usage --secret-id esv-test-secret-pi --file ${allConfigFile}": should describe the esv secret "esv-test-secret-pi" with usage from file ${allConfigFile} and json output`, async () => {
        const CMD = `frodo esv secret describe --json --usage --secret-id esv-test-secret-pi --file ${allConfigFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret describe --json --usage --secret-id esv-test-secret-pi --directory ${allConfigDirectory}": should describe the esv secret "esv-test-secret-pi" with usage from directory ${allConfigDirectory} and json output`, async () => {
        const CMD = `frodo esv secret describe --json --usage --secret-id esv-test-secret-pi --directory ${allConfigDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
