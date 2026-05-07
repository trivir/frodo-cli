import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo mapping rename', () => {
    test(`"frodo mapping rename -i sync/managedAlpha_application_managedBravo_application": should rename the mapping with id sync/managedAlpha_application_managedBravo_application to new"`, async () => {
        const CMD = `frodo mapping rename -i sync/managedAlpha_application_managedBravo_application`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping rename --legacy --mapping-id mapping/managedBravo_group_managedBravo_group": should rename the mapping with id mapping/managedBravo_group_managedBravo_group to legacy"`, async () => {
        const CMD = `frodo mapping rename --legacy --mapping-id mapping/managedBravo_group_managedBravo_group`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    // TODO: Get these tests passing. For some reason, after making new recordings, the tests fail due to missing recordings

    test.skip(`"frodo mapping rename --all": should rename all mappings to new"`, async () => {
        const CMD = `frodo mapping rename --all`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test.skip(`"frodo mapping rename -al": should rename all mappings to legacy"`, async () => {
        const CMD = `frodo mapping rename -al`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
