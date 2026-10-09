/** See test/e2e/README.md for how to write and record e2e tests. */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete journeys --dry-run -n test
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete journeys -n test
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete journeys --dry-run
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am FRODO_REALM=alpha frodo config-manager delete journeys
*/

import { getEnv, testSuccess } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
const env = getEnv(c);

describe('frodo config-manager delete journeys', () => {
    test(`"frodo config-manager delete journeys --dry-run -n test": should print a dry-run message deleting a specific journey by name in a specific realm"`, async () => {
        const CMD = `frodo config-manager delete journeys --dry-run -n test`;
        await testSuccess(CMD, {
            env: {
                ...env.env,
                FRODO_REALM: 'alpha'
            }
        });
    });
    test(`"frodo config-manager delete journeys -n test": should delete a specific journey by name in a specific realm"`, async () => {
        const CMD = `frodo config-manager delete journeys -n test`;
        await testSuccess(CMD, {
            env: {
                ...env.env,
                FRODO_REALM: 'alpha'
            }
        });
    });
    test(`"frodo config-manager delete journeys --dry-run": should print a dry-run message deleting all journeys in a specific realm"`, async () => {
        const CMD = `frodo config-manager delete journeys --dry-run`;
        await testSuccess(CMD, {
            env: {
                ...env.env,
                FRODO_REALM: 'alpha'
            }
        });
    });
    // test(`"frodo config-manager delete journeys": should print a dry-run message deleting a specific journey by name"`, async () => {
    //     const CMD = `frodo config-manager delete journeys`;
    //     await testSuccess(CMD, {
    //         env: {
    //             ...env.env,
    //             FRODO_REALM: 'alpha'
    //         }
    //     });
    // });
});
