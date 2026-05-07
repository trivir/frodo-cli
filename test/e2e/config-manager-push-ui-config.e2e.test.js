import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const forgeopsEnv = getEnv(fc);

const allDirectory = "test/e2e/exports/fr-config-manager/forgeops/";

describe('frodo config-manager push ui-config', () => {
    test(`"frodo config-manager push ui-config -D ${allDirectory}-m forgeops": should import ui-config into forgeops"`, async () => {
        const CMD = `frodo config-manager push ui-config -D ${allDirectory} -m forgeops`;
        const { stdout, stderr } = await exec(CMD, forgeopsEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });
});
