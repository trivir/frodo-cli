import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const managedObjectsExportDirectory =
  'test/e2e/exports/all-separate/cloud/global/idm/managed';
const alphaUserFile = 'alpha_user.managed.json';
const allManagedPath = 'test/e2e/exports/all/all.managed.json';

describe('frodo idm import', () => {
  test(`"frodo idm schema object import -D ${managedObjectsExportDirectory}": should import the managed objects from the directory ${managedObjectsExportDirectory}`, async () => {
    const CMD = `frodo idm schema object import -D ${managedObjectsExportDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo idm schema object import -i -f ${managedObjectsExportDirectory}/${alphaUserFile}": should import just the alpha user managed object ${managedObjectsExportDirectory}/${alphaUserFile}`, async () => {
    const CMD = `frodo idm schema object import -i -f ${managedObjectsExportDirectory}/${alphaUserFile}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo idm schema object import -f ${allManagedPath}": should import all managed objects from a single file ${allManagedPath}`, async () => {
    const CMD = `frodo idm schema object import -f ${allManagedPath}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });
});
