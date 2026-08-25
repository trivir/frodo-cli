import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);
const CMD = 'frodo idm schema object property describe --help';
const { stdout } = await exec(CMD);

test("CLI help interface for 'idm schema object property describe' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
