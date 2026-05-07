import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo node list', () => {
  test('"frodo node list": should list the names of the custom nodes', async () => {
    const CMD = `frodo node list`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test('"frodo node list -l": should list the ids, names, descriptions, and usages of the custom nodes.', async () => {
    const CMD = `frodo node list -l`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test('"frodo node list --long": should list the ids, names, descriptions, and usages of the custom nodes.', async () => {
    const CMD = `frodo node list --long`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });
});
