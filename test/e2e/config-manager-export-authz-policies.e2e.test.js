/**
 * Follow this process to write e2e tests for the CLI project:
 *
 * 1. Test if all the necessary mocks for your tests already exist.
 *    In mock mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=1 frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    If your command completes without errors and with the expected results,
 *    all the required mocks already exist and you are good to write your
 *    test and skip to step #4.
 *
 *    If, however, your command fails and you see errors like the one below,
 *    you know you need to record the mock responses first:
 *
 *    [Polly] [adapter:node-http] Recording for the following request is not found and `recordIfMissing` is `false`.
 *
 * 2. Record mock responses for your exact command.
 *    In mock record mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=record frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    Wait until you see all the Polly instances (mock recording adapters) have
 *    shutdown before you try to run step #1 again.
 *    Messages like these indicate mock recording adapters shutting down:
 *
 *    Polly instance 'conn/4' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 2s...
 *    Polly instance 'conn/save/3' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 1s...
 *    Polly instance 'conn/save/3' stopping in 2s...
 *    Polly instance 'conn/4' stopped.
 *    Polly instance 'conn/save/3' stopping in 1s...
 *    Polly instance 'conn/save/3' stopped.
 *
 * 3. Validate your freshly recorded mock responses are complete and working.
 *    Re-run the exact command you want to test in mock mode (see step #1).
 *
 * 4. Write your test.
 *    Make sure to use the exact command including number of arguments and params.
 *
 * 5. Commit both your test and your new recordings to the repository.
 *    Your tests are likely going to reside outside the frodo-lib project but
 *    the recordings must be committed to the frodo-lib project.
 */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export access-config -D testDir0 
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export audit -D testDir1
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authentication -D testDir2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authentication -D testDir3 -r bravo
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export cookie-domains -D testDir4
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export email-templates -D testDir5
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export email-templates -n registration -D testDir6
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export endpoints -D testDir7
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export endpoints -n testEndpoint2 -D testDir8
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export internal-roles -D testDir9
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export internal-roles -n test-internal-role -D testDir10
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export journeys  -D testDir11
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export journeys -r alpha -D testDir12
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export journeys -r alpha -n FrodoTest -D testDir13
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export kba -D testDir14
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export locales -D testDir15
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export locales -n fr -D testDir16
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export managed-objects -D testDir17
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export managed-objects -n alpha_user -D testDir18
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export password-policy -D testDir19
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export password-policy -D testDir20 -r alpha
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export remote-servers -D testDir21
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export saml -f test/fr-config-manager-pull-config/saml-config.json -D testDir22
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export schedules -D testDir23
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export schedules -n TestSchedule -D testDir24
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export secret-mappings -D testDir25
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export secret-mappings -r alpha -D testDir26
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export secret-mappings -r bravo -n es512 -D testDir27
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export service-objects -f test/fr-config-manager-pull-config/service-objects.json -D testDir28
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export services -D testDir29
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export services -r alpha -D testDir30
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export services -r alpha -n SocialIdentityProviders -D testDir31
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export test
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authz-policies -D testDir2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authz-policies -D configManagerExportAuthzPoliciesDir2
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authz-policies -D configManagerExportAuthzPoliciesDir3 -r alpha
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authz-policies --directory configManagerExportAuthzPoliciesDir4 -r bravo
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authz-policies -D configManagerExportAuthzPoliciesDir5 -p murphyTestPolicySet -r bravo
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo config-manager export authz-policies --directory configManagerExportAuthzPoliciesDir6 --p-set murphyTestPolicySet -r alpha
*/

import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager exports', () => {

  test('"frodo config-manager export access-config -D testDir0": should export the access-config in fr-config-manager style"', async () => {
    const dirName = 'testDir0';
    const CMD = `frodo config-manager export access-config -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export audit -D testDir1": should export the audit in fr-config-manager style"', async () => {
    const dirName = 'testDir1';
    const CMD = `frodo config-manager export audit -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export authentication -D testDir2": should export the authentication in fr-config-manager style"', async () => {
    const dirName = 'testDir2';
    const CMD = `frodo config-manager export authentication -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export authentication -D testDir3 -r bravo": should export the authentication in bravo realm in fr-config-manager style"', async () => {
    const dirName = 'testDir3';
    const CMD = `frodo config-manager export authentication -D ${dirName} -r bravo`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export cookie-domains -D testDir4": should export the cookie-domains in fr-config-manager style"', async () => {
    const dirName = 'testDir4';
    const CMD = `frodo config-manager export cookie-domains -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export email-templates -D testDir5": should export the email-templates in fr-config-manager style"', async () => {
    const dirName = 'testDir5';
    const CMD = `frodo config-manager export email-templates -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export email-templates -n registration -D testDir6": should export the email-template with name registration in fr-config-manager style"', async () => {
    const dirName = 'testDir6';
    const CMD = `frodo config-manager export email-templates -n registration -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export endpoints -D testDir7": should export the endpoints in fr-config-manager style"', async () => {
    const dirName = 'testDir7';
    const CMD = `frodo config-manager export endpoints -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export endpoints -n testEndpoint2 -D testDir8": should export the endpoint with name testEndpoint2 in fr-config-manager style"', async () => {
    const dirName = 'testDir8';
    const CMD = `frodo config-manager export endpoints -n testEndpoint2 -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export internal-roles -D testDir9": should export the internal-role in fr-config-manager style"', async () => {
    const dirName = 'testDir9';
    const CMD = `frodo config-manager export internal-roles -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export internal-roles -n test-internal-role -D testDir10": should export the internal-role with name test-internal-role in fr-config-manager style"', async () => {
    const dirName = 'testDir10';
    const CMD = `frodo config-manager export internal-roles -n test-internal-role -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export journeys -D testDir11": should export the journeys in fr-config-manager style"', async () => {
    const dirName = 'testDir11';
    const CMD = `frodo config-manager export journeys -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export journeys -r alpha -D testDir12": should export the journeys in alpha realm in fr-config-manager style"', async () => {
    const dirName = 'testDir12';
    const CMD = `frodo config-manager export journeys -r alpha -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export journeys -r alpha -n FrodoTest -D testDir13": should export journey with name: FrodoTest in fr-config-manager style"', async () => {
    const dirName = 'testDir13';
    const CMD = `frodo config-manager export journeys -r alpha -n FrodoTest -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export kba -D testDir14": should export the kba in fr-config-manager style"', async () => {
    const dirName = 'testDir14';
    const CMD = `frodo config-manager export kba -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export locales -D testDir15": should export the locales in fr-config-manager style"', async () => {
    const dirName = 'testDir15';
    const CMD = `frodo config-manager export locales -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export locales -n fr -D testDir16": should export the locale named: fr in fr-config-manager style"', async () => {
    const dirName = 'testDir16';
    const CMD = `frodo config-manager export locales -n fr -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export managed-objects -D testDir17": should export the managed-objects in fr-config-manager style"', async () => {
    const dirName = 'testDir17';
    const CMD = `frodo config-manager export managed-objects -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export managed-objects -n alpha_user -D testDir18": should export the managed-object named: alpha_user in fr-config-manager style"', async () => {
    const dirName = 'testDir18';
    const CMD = `frodo config-manager export managed-objects -n alpha_user -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export password-policy -D testDir19": should export the password-policy in fr-config-manager style"', async () => {
    const dirName = 'testDir19';
    const CMD = `frodo config-manager export password-policy -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export password-policy -D testDir20 -r alpha": should export the password-policy in alpha realm in fr-config-manager style"', async () => {
    const dirName = 'testDir20';
    const CMD = `frodo config-manager export password-policy -D ${dirName} -r alpha`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export remote-servers -D testDir21": should export the remote-servers in fr-config-manager style"', async () => {
    const dirName = 'testDir21';
    const CMD = `frodo config-manager export remote-servers -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export saml -f test/fr-config-manager-pull-config/saml-config.json -D testDir22": should export the saml based on salm-config.json file in fr-config-manager style"', async () => {
    const dirName = 'testDir22';
    const CMD = `frodo config-manager export saml -f test/fr-config-manager-pull-config/saml-config.json -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export schedules -D testDir23": should export the schedules in fr-config-manager style"', async () => {
    const dirName = 'testDir23';
    const CMD = `frodo config-manager export schedules -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export schedules -n TestSchedule -D testDir24": should export the schedule named:TestSchedule in fr-config-manager style"', async () => {
    const dirName = 'testDir24';
    const CMD = `frodo config-manager export schedules -n TestSchedule -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export secret-mappings -D testDir25": should export the secret-mappings in fr-config-manager style"', async () => {
    const dirName = 'testDir25';
    const CMD = `frodo config-manager export  secret-mappings -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export secret-mappings -r alpha -D testDir26": should export the secret-mappings in alpha realm in fr-config-manager style"', async () => {
    const dirName = 'testDir26';
    const CMD = `frodo config-manager export secret-mappings -r alpha -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export secret-mappings -r bravo -n es512 -D testDir27": should export the secret-mappings with alias name:es512 in fr-config-manager style"', async () => {
    const dirName = 'testDir27';
    const CMD = `frodo config-manager export secret-mappings -r bravo -n es512 -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export service-objects -f test/fr-config-manager-pull-config/service-objects.json -D testDir28": should export the service-objects based on service-objects.json config file in fr-config-manager style"', async () => {
    const dirName = 'testDir28';
    const CMD = `frodo config-manager export service-objects -f test/fr-config-manager-pull-config/service-objects.json -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export services -D testDir29": should export the services in fr-config-manager style"', async () => {
    const dirName = 'testDir29';
    const CMD = `frodo config-manager export services -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export services -r alpha -D testDir30": should export the services in alpha realm in fr-config-manager style"', async () => {
    const dirName = 'testDir30';
    const CMD = `frodo config-manager export services -r alpha -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export services -r alpha -n SocialIdentityProviders -D testDir31": should export the services with name: SocialIdentityProviders in fr-config-manager style"', async () => {
    const dirName = 'testDir31';
    const CMD = `frodo config-manager export services -r alpha -n SocialIdentityProviders -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export test": should receive access tokens"', async () => {
    const CMD = `frodo config-manager export test`;
    await testExport(CMD, env, undefined, undefined, '', false);
  });

  test('"frodo config-manager export authz-policies": should export policies, policy-sets, and resource-types of specified realm into new folder in working directory"', async () => {
    const dirName = 'testDir2';
    const CMD = `frodo config-manager export authz-policies -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test('"frodo config-manager export authz-policies -D configManagerExportAuthzPoliciesDir2": should export policies, policy-sets, and resource-types from all realms in fr-config manager style.', async () => {
    const dirName = 'configManagerExportAuthzPoliciesDir2';
    const CMD = `frodo config-manager export authz-policies -D ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export authz-policies -D configManagerExportAuthzPoliciesDir3 -r alpha: should export policies, policy-sets, and resource-types from the alpha realm in fr-config manager style.', async () => {    
      const dirName = 'configManagerExportAuthzPoliciesDir3';
      const realm = 'alpha';
      const CMD = `frodo config-manager export authz-policies -D ${dirName} -r ${realm}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export authz-policies --directory configManagerExportAuthzPoliciesDir4 -r bravo": should export policies, policy-sets, and resource-types from the bravo realm in fr-config manager style.', async () => {
      const dirName = 'configManagerExportAuthzPoliciesDir4';
      const realm = 'bravo';
      const CMD = `frodo config-manager export authz-policies --directory ${dirName} -r ${realm}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export authz-policies -D configManagerExportAuthzPoliciesDir5 -p murphyTestPolicySet -r bravo: should export only the policy set with the id: "murphyTestPolicySet".', async () => {
      const dirName = 'configManagerExportAuthzPoliciesDir5';
      const policySetName = 'murphyTestPolicySet';
      const realm = 'bravo';
      const CMD = `frodo config-manager export authz-policies -D ${dirName} -p ${policySetName} -r ${realm}`;
      await testExport(CMD, env, undefined, undefined, dirName, false);
  });
  test('"frodo config-manager export authz-policies -p murphyTestPolicySet -r alpha": should fail because murphyTestPolicySet belongs to the bravo realm, not alpha.', async () => {
      const policySetName = 'murphyTestPolicySet';
      const realm = 'alpha';
      const CMD = `frodo config-manager export authz-policies -p ${policySetName} -r ${realm}`;
      await expect(async ()=> await exec(CMD, env)).rejects.toThrow(`Make sure the policy-set "${policySetName}" is in the realm "${realm}"`);
  });

});