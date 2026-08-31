import cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);

test("CLI help interface for 'settings theme' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme list' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme list --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme show' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme show --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme set' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme set --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme background' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme background --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme contrast' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme contrast --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme detect' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme detect --help');
  expect(stdout).toMatchSnapshot();
});

test("CLI help interface for 'settings theme autodetect' should be expected english", async () => {
  const { stdout } = await exec('frodo settings theme autodetect --help');
  expect(stdout).toMatchSnapshot();
});
