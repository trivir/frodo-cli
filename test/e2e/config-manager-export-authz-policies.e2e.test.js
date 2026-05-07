import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pulls', () => {
 test('"frodo config-manager pull authz-policies -D configManagerExportAuthzPoliciesDir2": should export policies, policy-sets, and resource-types from all realms in fr-config manager style.', async () => {
         const dirName = 'configManagerExportAuthzPoliciesDir2';
         const CMD = `frodo config-manager pull authz-policies -D ${dirName}`;
         await testExport(CMD, env, undefined, undefined, dirName, false);
     });
     test('"frodo config-manager pull authz-policies -D configManagerExportAuthzPoliciesDir3 -r alpha": should export policies, policy-sets, and resource-types from the alpha realm in fr-config manager style.', async () => {    
         const dirName = 'configManagerExportAuthzPoliciesDir3';
         const realm = 'alpha';
         const CMD = `frodo config-manager pull authz-policies -D ${dirName} -r ${realm}`;
         await testExport(CMD, env, undefined, undefined, dirName, false);
     });
     test('"frodo config-manager pull authz-policies --directory configManagerExportAuthzPoliciesDir4 -r bravo": should export policies, policy-sets, and resource-types from the bravo realm in fr-config manager style.', async () => {
         const dirName = 'configManagerExportAuthzPoliciesDir4';
         const realm = 'bravo';
         const CMD = `frodo config-manager pull authz-policies --directory ${dirName} -r ${realm}`;
         await testExport(CMD, env, undefined, undefined, dirName, false);
     });
     test('"frodo config-manager pull authz-policies -D configManagerExportAuthzPoliciesDir5 -n murphyTestPolicySet -r bravo": should export only the policy set with the id: "murphyTestPolicySet".', async () => {
         const dirName = 'configManagerExportAuthzPoliciesDir5';
         const policySetName = 'murphyTestPolicySet';
         const realm = 'bravo';
         const CMD = `frodo config-manager pull authz-policies -D ${dirName} -n ${policySetName} -r ${realm}`;
         await testExport(CMD, env, undefined, undefined, dirName, false);
     });
     test('"frodo config-manager pull authz-policies -D configManagerExportAuthzPoliciesDir6-f test/e2e/fr-config-manager-pull-config/authz-policies.json" : should export only the policy set with the id: "murphyTestPolicySet".', async () => {
        const dirName = 'configManagerExportAuthzPoliciesDir6'
        const CMD = `frodo config-manager pull authz-policies -D ${dirName} -f test/e2e/fr-config-manager-pull-config/authz-policies.json`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
});