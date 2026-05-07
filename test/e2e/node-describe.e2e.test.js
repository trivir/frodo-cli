import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo node describe', () => {
  test(`"frodo node describe -i c605506774a848f7877b4d17a453bd39": should describe the custom node with service name "c605506774a848f7877b4d17a453bd39"`, async () => {
    const CMD = `frodo node describe -i c605506774a848f7877b4d17a453bd39`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo node describe -n 'Display Callback'": should describe the custom node with display name "Display Callback"`, async () => {
    const CMD = `frodo node describe -n 'Display Callback'`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo node describe --node-name 'Unknown'": should fail to describe the non-existent custom node with name "Unknown"`, async () => {
    const CMD = `frodo node describe --node-name 'Unknown'`;
    try {
      await exec(CMD, env);
      fail("Command should've failed")
    } catch (e) {
      expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
    }
  });

  test(`"frodo node describe --json --node-id c605506774a848f7877b4d17a453bd39-1": should describe the custom node with id "c605506774a848f7877b4d17a453bd39-1" with json output`, async () => {
    const CMD = `frodo node describe --json --node-id c605506774a848f7877b4d17a453bd39-1`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo node describe --json --node-name 'Display Callback'": should describe the custom node with name "Display Callback" with json output`, async () => {
    const CMD = `frodo node describe --json --node-name 'Display Callback'`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });
});
