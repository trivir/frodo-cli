import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes, testif } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/Connections.json';
process.env['FRODO_MASTER_KEY_PATH'] =
  './test/e2e/env/masterkey.key';
const env = getEnv(c);

describe('frodo conn list', () => {
  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    '"frodo conn list": should list the connection hosts',
    async () => {
      const CMD = `frodo conn list`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    '"frodo conn list -l": should list the connection hosts, service accounts, usernames, and log API keys.',
    async () => {
      const CMD = `frodo conn list -l`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    '"frodo conn list --long": should list the connection hosts, service accounts, usernames, and log API keys.',
    async () => {
      const CMD = `frodo conn list --long`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    }
  );
});
