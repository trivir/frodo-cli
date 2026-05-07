import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const type = 'idm';

describe('frodo idm schema object export', () => {
  test('"frodo idm schema object export -a": should export all managed objects into a single file', async () => {
    const CMD = `frodo idm schema object export -a`;
    await testExport(CMD, env, type, undefined, undefined, false);
  });

  test('"frodo idm schema object export -a -D testDir1": should export all managed objects into a single file in testDir1', async () => {
    const dirName = 'testDir1';
    const CMD = `frodo idm schema object export -a -D ${dirName}`;
    await testExport(CMD, env, type, undefined, dirName, false);
  });

  test('"frodo idm schema object export -a -D testDir2 -f test.file.json": should export all managed objects into a single file named test.file.json in testDir2', async () => {
    const dirName = 'testDir2';
    const fileName = 'test.file.json';
    const CMD = `frodo idm schema object export -a -D ${dirName} -f ${fileName}`;
    await testExport(CMD, env, type, fileName, dirName, false);
  });

  test('"frodo idm schema object export -a -f test.file.json": should export all managed objects into a single file named test.file.json', async () => {
    const fileName = 'test.file.json';
    const CMD = `frodo idm schema object export -a -f ${fileName}`;
    await testExport(CMD, env, type, fileName, undefined, false);
  });

  test('"frodo idm schema object export -A": should export all managed objects into separate files in the default directory "managed"', async () => {
    const defaultDirName = 'managed';
    const CMD = `frodo idm schema object export -A`;
    await testExport(CMD, env, type, undefined, defaultDirName, false);
  });

  test('"frodo idm schema object export -A -D testDir3": should export all managed objects into separate files in the directory "testDir3"', async () => {
    const dirName = 'testDir3';
    const CMD = `frodo idm schema object export -A -D ${dirName}`;
    await testExport(CMD, env, type, undefined, dirName, false);
  });

  test('"frodo idm schema object export -i alpha_user": should export the alpha_user managed object into a file named "alpha_user.managed.json"', async () => {
    const defaultFileName = 'alpha_user.managed.json';
    const CMD = `frodo idm schema object export -i alpha_user`;
    await testExport(CMD, env, type, defaultFileName, undefined, false);
  });

  test('"frodo idm schema object export -i bravo_assignment -f test2.file.json": should export the bravo_assignment managed object into a file named "test2.file.json"', async () => {
    const fileName = 'test2.file.json';
    const CMD = `frodo idm schema object export -i bravo_assignment -f ${fileName}`;
    await testExport(CMD, env, type, fileName, undefined, false);
  });

  test('"frodo idm schema object export -i alpha_role -f test2.file.json -D testDir4": should export the alpha_role managed object into a file named "test2.file.json" in the directory "testDir4"', async () => {
    const dirName = 'testDir4';
    const fileName = 'test2.file.json';
    const CMD = `frodo idm schema object export -i alpha_role -f ${fileName} -D ${dirName}`;
    await testExport(CMD, env, type, fileName, dirName, false);
  });

  test('"frodo idm schema object export -i alpha_group -D testDir5": should export the alpha_group managed object into a file named "alpha_group.managed.json" in the directory "testDir5"', async () => {
    const defaultFileName = 'alpha_group.managed.json';
    const dirName = 'testDir5';
    const CMD = `frodo idm schema object export -i alpha_group -D ${dirName}`;
    await testExport(CMD, env, type, defaultFileName, dirName, false);
  });
});
