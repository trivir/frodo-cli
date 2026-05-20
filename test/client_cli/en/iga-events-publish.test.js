import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);
const CMD = 'frodo iga events publish --help';
const { stdout } = await exec(CMD);

test("CLI help interface for 'iga events publish' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
