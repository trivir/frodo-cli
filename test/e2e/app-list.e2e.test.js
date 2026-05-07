import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c, forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);
const forgeopsEnv = getEnv(fc);

describe('frodo app list', () => {
    test('"frodo app list": should list the ids of the apps', async () => {
        const CMD = `frodo app list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list -l": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of the apps', async () => {
        const CMD = `frodo app list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list -lm forgeops": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of "application" managed objects', async () => {
        const CMD = `frodo app list -lm forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_TEST_NAME: 'rootNoPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list --long --use-realm-prefix-on-managed-objects --type forgeops": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of "application" managed objects', async () => {
        const CMD = `frodo app list --long --use-realm-prefix-on-managed-objects --type forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_TEST_NAME: 'rootPrefix'
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list -lm forgeops": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of "application" managed objects', async () => {
        const CMD = `frodo app list -lm forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha',
                FRODO_TEST_NAME: 'alphaNoPrefix'
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list --long --use-realm-prefix-on-managed-objects --type forgeops": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of "alpha_application" managed objects', async () => {
        const CMD = `frodo app list --long --use-realm-prefix-on-managed-objects --type forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha',
                FRODO_TEST_NAME: 'alphaPrefix'
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list -lm forgeops": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of "application" managed objects', async () => {
        const CMD = `frodo app list -lm forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha/bravo',
                FRODO_TEST_NAME: 'alphaBravoNoPrefix'
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo app list --long --use-realm-prefix-on-managed-objects --type forgeops": should list the ids, statuses, client types, grant types, scopes, and redirect URIs of "bravo_application" managed objects', async () => {
        const CMD = `frodo app list --long --use-realm-prefix-on-managed-objects --type forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha/bravo',
                FRODO_TEST_NAME: 'alphaBravoPrefix'
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
