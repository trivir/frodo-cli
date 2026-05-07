import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const forgeopsEnv = getEnv(fc);

const allDirectory = "test/e2e/exports/fr-config-manager/forgeops";

test(`"frodo config-manager push password-policy -D ${allDirectory} -m forgeops": should import the password policy into forgeops"`, async () => {
    const CMD = `frodo config-manager push password-policy -D ${allDirectory} -m forgeops`;
    const { stdout } = await exec(CMD, forgeopsEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
});

test(`"frodo config-manager push password-policy -r alpha ${allDirectory} -m forgeops": should import a specific password policy by name into forgeops"`, async () => {
    const CMD = `frodo config-manager push password-policy -r alpha -D ${allDirectory} -m forgeops`;
    const { stdout } = await exec(CMD, forgeopsEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
});