import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);
const CMD = 'frodo iga events export --help';
const { stdout } = await exec(CMD);

test("CLI help interface for 'iga events export' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
