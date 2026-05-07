import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const forgeopsEnv = getEnv(fc);

const allDirectory = "test/e2e/exports/fr-config-manager/forgeops";

test(`"frodo config-manager push themes -D ${allDirectory} -m forgeops": should import the themes into forgeops"`, async () => {
    const CMD = `frodo config-manager push themes -D ${allDirectory} -m forgeops`;
    const { stdout } = await exec(CMD, {
        env: {
            ...forgeopsEnv.env,
            FRODO_REALM: 'alpha'
        }
    });
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
});