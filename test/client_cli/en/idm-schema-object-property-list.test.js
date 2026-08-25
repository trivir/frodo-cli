import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);
const CMD = 'frodo idm schema object property list --help';
const { stdout } = await exec(CMD);

test("CLI help interface for 'idm schema object property list' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
