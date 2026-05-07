import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const cloudEnv = getEnv(c);

const allDirectory = "test/e2e/exports/fr-config-manager/cloud";

describe('frodo config-manager push cookie-domains', () => {
    test(`"frodo config-manager push cookie-domains -D ${allDirectory} ": should import the cookie-domains into cloud"`, async () => {
        const CMD = `frodo config-manager push cookie-domains -D ${allDirectory}`;
        const { stdout, stderr } = await exec(CMD, cloudEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });
});