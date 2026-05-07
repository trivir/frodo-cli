import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const forgeopsEnv = getEnv(fc);

const allDirectory = "test/e2e/exports/fr-config-manager/forgeops";

describe('frodo config-manager pulls authentication', () => {
    test(`"frodo config-manager push authentication -D ${allDirectory} -m forgeops": should import the authentication into forgeops"`, async () => {
        const CMD = `frodo config-manager push authentication -D ${allDirectory} -m forgeops`;
        const { stdout } = await exec(CMD, forgeopsEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
    test(`"frodo config-manager push authentication -r alpha -D ${allDirectory} -m forgeops": should import an authentication config by realm into forgeops"`, async () => {
        const CMD = `frodo config-manager push authentication -r alpha -D ${allDirectory} -m forgeops`;
        const { stdout } = await exec(CMD, forgeopsEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
