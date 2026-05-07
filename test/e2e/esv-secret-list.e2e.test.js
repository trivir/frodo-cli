import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allConfigFile = 'test/e2e/exports/all/all.cloud.json';
const allConfigDirectory = 'test/e2e/exports/all-separate/cloud';

describe('frodo esv secret list', () => {
    test('"frodo esv secret list": should list the ids of the esv secrets', async () => {
        const CMD = `frodo esv secret list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo esv secret list -l": should list the ids, active/loaded versions, statuses, descriptions, modifiers, and modified times of the esv secrets', async () => {
        const CMD = `frodo esv secret list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo esv secret list -u": should list the usage of the esv secrets', async () => {
        const CMD = `frodo esv secret list -u`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
            expect(removeAnsiEscapeCodes(e.stdout)).toMatchSnapshot();
        }
    });

    test('"frodo esv secret list -lu": should list the ids, active/loaded versions, statuses, descriptions, modifiers, modified times, and usage of the esv secrets', async () => {
        const CMD = `frodo esv secret list -lu`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
            expect(removeAnsiEscapeCodes(e.stdout)).toMatchSnapshot();
        }
    });

    test(`"frodo esv secret list -uf ${allConfigFile}": should list the usage of the esv secrets in the ${allConfigFile} file`, async () => {
        const CMD = `frodo esv secret list -uf ${allConfigFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret list --usage --long --file ${allConfigFile}": should list the ids, active/loaded versions, statuses, descriptions, modifiers, modified times, and usage of the esv secrets in the ${allConfigFile} file`, async () => {
        const CMD = `frodo esv secret list --usage --long --file ${allConfigFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret list -uD ${allConfigDirectory}": should list the usage of the esv secrets in the ${allConfigDirectory} directory`, async () => {
        const CMD = `frodo esv secret list -uD ${allConfigDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo esv secret list --usage --long --directory ${allConfigDirectory}": should list the ids, active/loaded versions, statuses, descriptions, modifiers, modified times, and usage of the esv secrets in the ${allConfigDirectory} directory`, async () => {
        const CMD = `frodo esv secret list --usage --long --directory ${allConfigDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
