import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);
const CMD = 'frodo idm schema relationship update --help';
const { stdout } = await exec(CMD);

test("CLI help interface for 'idm schema relationship update' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
