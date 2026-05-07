import { getEnv, testExport } from './utils/TestUtils';
import { connection as c, forgeops_connection as fc } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);
const forgeopsEnv = getEnv(fc);

const type = 'application';

describe('frodo app export', () => {
  test('"frodo app export -i 0d86aa45-b73e-4924-9165-8c7f47eb19b5": should export the app with app id "0d86aa45-b73e-4924-9165-8c7f47eb19b5"', async () => {
    const exportFile = '0d86aa45-b73e-4924-9165-8c7f47eb19b5.application.json';
    const CMD = `frodo app export -i 0d86aa45-b73e-4924-9165-8c7f47eb19b5`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export --app-id 325bd28a-7c57-43fd-9241-30ee086b4301": should export the app with app id "325bd28a-7c57-43fd-9241-30ee086b4301"', async () => {
    const exportFile = '325bd28a-7c57-43fd-9241-30ee086b4301.application.json';
    const CMD = `frodo app export --app-id 325bd28a-7c57-43fd-9241-30ee086b4301`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export -n HRLite": should export the app with app name "HRLite"', async () => {
    const exportFile = 'HRLite.application.json';
    const CMD = `frodo app export -n HRLite`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export --app-name EncoreADv2": should export the app with app name "EncoreADv2"', async () => {
    const exportFile = 'EncoreADv2.application.json';
    const CMD = `frodo app export --app-name EncoreADv2`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export -n HRLite -f my-HRLite.application.json": should export the app with app name "HRLite" into file named my-HRLite.application.json', async () => {
    const exportFile = 'my-HRLite.application.json';
    const CMD = `frodo app export -n HRLite -f ${exportFile}`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export -n HRLite --no-deps -f my-nodeps-HRLite.application.json": should export the app with app name "HRLite" with no dependencies into a file named my-nodeps-HRLite.application.json', async () => {
    const exportFile = 'my-nodeps-HRLite.application.json';
    const CMD = `frodo app export -n HRLite --no-deps -f ${exportFile}`;
    await testExport(CMD, env, type, exportFile);
  });

  // TODO: Generate mocks for this test (skip for the meantime)
  test.skip('"frodo app export -Nn HRLite -D appExportTestDir1": should export the app with app name "HRLite" into the directory appExportTestDir1', async () => {
    const exportDirectory = 'appExportTestDir1';
    const CMD = `frodo app export -Nn HRLite -D ${exportDirectory}`;
    await testExport(CMD, env, type, undefined, exportDirectory, false);
  });

  test('"frodo app export -a": should export all apps to a single file', async () => {
    const exportFile = 'allAlphaApplications.application.json';
    const CMD = `frodo app export -a`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export --all -f my-allAlphaApplications.application.json": should export all apps to a single file named my-allAlphaApplications.application.json', async () => {
    const exportFile = 'my-allAlphaApplications.application.json';
    const CMD = `frodo app export --all -f ${exportFile}`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export -a --file my-other-allAlphaApplications.application.json": should export all apps to a single file named my-other-allAlphaApplications.application.json', async () => {
    const exportFile = 'my-other-allAlphaApplications.application.json';
    const CMD = `frodo app export -a --file ${exportFile}`;
    await testExport(CMD, env, type, exportFile);
  });

  test('"frodo app export -a --no-deps -f my-yet-another-allAlphaApplications.application.json": should export all apps to a single file with no dependencies into a file named my-yet-another-allAlphaApplications.application.json', async () => {
    const exportFile = 'my-yet-another-allAlphaApplications.application.json';
    const CMD = `frodo app export -a --no-deps -f ${exportFile}`;
    await testExport(CMD, env, type, exportFile);
  });

  // TODO: Generate mocks for this test (skip for the meantime)
  test.skip('"frodo app export -NaD appExportTestDir2": should export all apps to a single file in the directory appExportTestDir2', async () => {
    const exportDirectory = 'appExportTestDir2';
    const CMD = `frodo app export -NaD ${exportDirectory}`;
    await testExport(CMD, env, type, undefined, exportDirectory, false);
  });

  test('"frodo app export -A": should export all apps to separate files', async () => {
    const CMD = `frodo app export -A`;
    await testExport(CMD, env, type);
  });

  // TODO: Generate mocks for this test (skip for the meantime)
  test.skip('"frodo app export --all-separate --no-metadata --no-deps --directory appExportTestDir3": should export all apps to separate files in the directory appExportTestDir3', async () => {
    const exportDirectory = 'appExportTestDir3';
    const CMD = `frodo app export --all-separate --no-metadata --no-deps --directory ${exportDirectory}`;
    await testExport(CMD, env, type, undefined, exportDirectory, false);
  });

  test('"frodo app export -f forgeopsRootNoPrefixApps.application.json -am forgeops": should export all "application" apps to a single file', async () => {
    const exportFile = 'forgeopsRootNoPrefixApps.application.json';
    const CMD = `frodo app export -f forgeopsRootNoPrefixApps.application.json -am forgeops`;
    await testExport(CMD, {
      env: {
          ...forgeopsEnv.env,
          FRODO_TEST_NAME: 'rootNoPrefix',
      }
    }, type, exportFile);
  });

  test('"frodo app export --file forgeopsRootPrefixApps.application.json --all --use-realm-prefix-on-managed-objects --type forgeops": should export all "application" apps to a single file', async () => {
    const exportFile = 'forgeopsRootPrefixApps.application.json';
    const CMD = `frodo app export --file forgeopsRootPrefixApps.application.json --all --use-realm-prefix-on-managed-objects --type forgeops`;
    await testExport(CMD, {
      env: {
          ...forgeopsEnv.env,
          FRODO_TEST_NAME: 'rootPrefix',
      }
    }, type, exportFile);
  });

  test('"frodo app export -f forgeopsAlphaNoPrefixApps.application.json -am forgeops": should export all "application" apps to a single file', async () => {
    const exportFile = 'forgeopsAlphaNoPrefixApps.application.json';
    const CMD = `frodo app export -f forgeopsAlphaNoPrefixApps.application.json -am forgeops`;
    await testExport(CMD, {
      env: {
          ...forgeopsEnv.env,
          FRODO_REALM: 'alpha',
          FRODO_TEST_NAME: 'alphaNoPrefix',
      }
    }, type, exportFile);
  });

  test('"frodo app export --file forgeopsAlphaPrefixApps.application.json --all --use-realm-prefix-on-managed-objects --type forgeops": should export all "alpha_application" apps to a single file', async () => {
    const exportFile = 'forgeopsAlphaPrefixApps.application.json';
    const CMD = `frodo app export --file forgeopsAlphaPrefixApps.application.json --all --use-realm-prefix-on-managed-objects --type forgeops`;
    await testExport(CMD, {
      env: {
          ...forgeopsEnv.env,
          FRODO_REALM: 'alpha',
          FRODO_TEST_NAME: 'alphaPrefix',
      }
    }, type, exportFile);
  });

  test('"frodo app export -f forgeopsAlphaBravoNoPrefixApps.application.json -am forgeops": should export all "application" apps to a single file', async () => {
    const exportFile = 'forgeopsAlphaBravoNoPrefixApps.application.json';
    const CMD = `frodo app export -f forgeopsAlphaBravoNoPrefixApps.application.json -am forgeops`;
    await testExport(CMD, {
      env: {
          ...forgeopsEnv.env,
          FRODO_REALM: 'alpha/bravo',
          FRODO_TEST_NAME: 'alphaBravoNoPrefix',
      }
    }, type, exportFile);
  });

  test('"frodo app export --file forgeopsAlphaBravoPrefixApps.application.json --all --use-realm-prefix-on-managed-objects --type forgeops": should export all "bravo_application" apps to a single file', async () => {
    const exportFile = 'forgeopsAlphaBravoPrefixApps.application.json';
    const CMD = `frodo app export --file forgeopsAlphaBravoPrefixApps.application.json --all --use-realm-prefix-on-managed-objects --type forgeops`;
    await testExport(CMD, {
      env: {
          ...forgeopsEnv.env,
          FRODO_REALM: 'alpha/bravo',
          FRODO_TEST_NAME: 'alphaBravoPrefix',
      }
    }, type, exportFile);
  });
});
