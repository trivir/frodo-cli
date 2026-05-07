import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const type = 'idm';
const entitiesFile = 'test/e2e/env/testEntitiesFile.json';
const envFile = 'test/e2e/env/testEnvFile.env';

describe('frodo idm export', () => {
  test('"frodo idm export --entity-id script": should export the idm config entity with idm id "script"', async () => {
    const exportFile = 'script.idm.json';
    const CMD = `frodo idm export --entity-id script`;
    await testExport(CMD, env, type, exportFile, undefined, false);
  });

  test(`"frodo idm export -i script -e ${envFile} -f my-script.idm.json": should export the idm config entity with idm id "script" into file named my-script.idm.json`, async () => {
    const exportFile = 'my-script.idm.json';
    const CMD = `frodo idm export -i script -e ${envFile} -f ${exportFile}`;
    await testExport(CMD, env, type, exportFile, undefined, false);
  });

  test('"frodo idm export -i script -D testDir4": should export the idm config entity with idm id "script" into the directory testDir4', async () => {
    const dirName = 'testDir4';
    const CMD = `frodo idm export -i script -D ${dirName}`;
    await testExport(CMD, env, type, undefined, dirName, false);
  });

  test('"frodo idm export -si sync": should export the idm config entity with idm id "sync" separately', async () => {
    const dirName = 'sync';
    const CMD = `frodo idm export -si sync`;
    await testExport(CMD, env, 'sync', undefined, dirName, false);
  });

  test('"frodo idm export -Ni sync": should export the idm config entity with idm id "sync" separately', async () => {
    const CMD = `frodo idm export -Ni sync`;
    await testExport(CMD, env, 'sync', 'sync.idm.json', undefined, false);
  });

  test('"frodo idm export -a": should export all idm config entities to a single file', async () => {
    const exportFile = 'all.idm.json';
    const CMD = `frodo idm export -a`;
    await testExport(CMD, env, type, exportFile);
  });

  test(`"frodo idm export --all --file allIdmTestFile.json -E ${entitiesFile} -e ${envFile} --no-metadata": should export all idm config entities to a single file named allIdmTestFile.json`, async () => {
    const exportFile = 'allIdmTestFile.json';
    const CMD = `frodo idm export --all --file ${exportFile} -E ${entitiesFile} -e ${envFile} --no-metadata`;
    await testExport(CMD, env, type, exportFile, undefined, false);
  });

  test('"frodo idm export -AD testDir1": should export all idm config entities to separate files in the "testDir" directory', async () => {
    const dirName = 'testDir1';
    const CMD = `frodo idm export -AD ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test(`"frodo idm export --all-separate --no-metadata --separate-mappings --directory testDir3 --entities-file ${entitiesFile} --env-file ${envFile}": should export all idm config entities to separate files in the "testDir" directory according to the entity and env files`, async () => {
    const dirName = 'testDir3';
    const CMD = `frodo idm export --all-separate --no-metadata --separate-mappings --directory ${dirName} --entities-file ${entitiesFile} --env-file ${envFile}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });

  test(`"frodo idm export --all-separate --no-metadata --separate-objects --directory testDir5": should export all idm config entities to separate files in the "testDir5" directory`, async () => {
    const dirName = 'testDir5';
    const CMD = `frodo idm export --all-separate --no-metadata --separate-objects --directory ${dirName}`;
    await testExport(CMD, env, undefined, undefined, dirName, false);
  });
});
