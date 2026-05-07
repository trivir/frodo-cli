import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allConfigFile = 'test/e2e/exports/all/all.cloud.json';
const allConfigDirectory = 'test/e2e/exports/all-separate/cloud';

describe('frodo script list', () => {
    test('"frodo script list": should list the names of the scripts', async () => {
        const CMD = `frodo script list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo script list -l": should list the names, uuids, languages, contexts, and descriptions of the scripts', async () => {
        const CMD = `frodo script list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo script list -u": should list the usage of the scripts', async () => {
        const CMD = `frodo script list -u`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
            expect(removeAnsiEscapeCodes(e.stdout)).toMatchSnapshot();
        }
    });

    test('"frodo script list -lu": should list the names, uuids, languages, contexts, usage, and descriptions of the scripts', async () => {
        const CMD = `frodo script list -lu`;
        try {
            await exec(CMD, env);
            fail("Command should've failed")
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
            expect(removeAnsiEscapeCodes(e.stdout)).toMatchSnapshot();
        }
    });

    test(`"frodo script list -uf ${allConfigFile}": should list the usage of the scripts in the ${allConfigFile} file`, async () => {
        const CMD = `frodo script list -uf ${allConfigFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo script list --usage --long --file ${allConfigFile}": should list the usage of the scripts in the ${allConfigFile} file`, async () => {
        const CMD = `frodo script list --usage --long --file ${allConfigFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo script list -uD ${allConfigDirectory}": should list the usage of the scripts in the ${allConfigDirectory} directory`, async () => {
        const CMD = `frodo script list -uD ${allConfigDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo script list --usage --long --directory ${allConfigDirectory}": should list the usage of the scripts in the ${allConfigDirectory} directory`, async () => {
        const CMD = `frodo script list --usage --long --directory ${allConfigDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
