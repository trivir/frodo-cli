import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);
const CMD = 'frodo script type describe --help';
const { stdout } = await exec(CMD);

test("CLI help interface for 'script type describe' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
