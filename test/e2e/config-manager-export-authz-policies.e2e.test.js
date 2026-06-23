/** See test/e2e/README.md for how to write and record e2e tests. */

/*
// ForgeOps
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo config-manager pull authz-policies -D configManagerExportAuthzPoliciesDir1 -f test/e2e/fr-config-manager-pull-config/authz-policies.json -m forgeops
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://nightly.gcp.forgeops.com/am frodo config-manager pull authz-policies --directory configManagerExportAuthzPoliciesDir2 -f test/e2e/fr-config-manager-pull-config/authz-policies.json -m forgeops
*/

import { getEnv, testExport } from './utils/TestUtils';
import { forgeops_connection as fc } from './utils/TestConfig';

process.env['FRODO_MOCK'] ||= '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const forgeopsEnv = getEnv(fc);

describe('frodo config-manager pulls', () => {
    test('"frodo config-manager pull authz-policies -D configManagerExportAuthzPoliciesDir1 -f test/e2e/fr-config-manager-pull-config/authz-policies.json -m forgeops": should export policies, policy-sets, and resource-types from all realms in fr-config manager style.', async () => {
        const dirName = 'configManagerExportAuthzPoliciesDir1';
        const CMD = `frodo config-manager pull authz-policies -D ${dirName} -f test/e2e/fr-config-manager-pull-config/authz-policies.json -m forgeops`;
        await testExport(CMD, forgeopsEnv, undefined, undefined, dirName, false);
    });
    test('"frodo config-manager pull authz-policies --directory configManagerExportAuthzPoliciesDir2 -f test/e2e/fr-config-manager-pull-config/authz-policies.json -m forgeops": should export policies, policy-sets, and resource-types from all realms in fr-config manager style.', async () => {
        const dirName = 'configManagerExportAuthzPoliciesDir2';
        const CMD = `frodo config-manager pull authz-policies --directory ${dirName} -f test/e2e/fr-config-manager-pull-config/authz-policies.json -m forgeops`;
        await testExport(CMD, forgeopsEnv, undefined, undefined, dirName, false);
    });
});