import { getEnv } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';
import cp from 'child_process';
import { promisify } from 'util';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
const env = getEnv(c);
const exec = promisify(cp.exec);

describe('frodo config-manager pulls', () => {
  test('"frodo config-manager pull test": should receive access tokens"', async () => {
      const CMD = `frodo config-manager pull test`;
      const output = await exec(CMD, env);
      expect(output.stdout).toMatchSnapshot();
      expect(output.stderr).toMatchSnapshot();
    });
});