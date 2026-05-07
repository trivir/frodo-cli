import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes, testif } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';
import { readFileSync, rmSync, writeFileSync } from 'fs';

const exec = promisify(cp.exec);

const connectionsFile = './test/e2e/env/Connections.json';
const connectionsDeleteFile = './test/e2e/env/ConnectionsDelete.json';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] = connectionsDeleteFile;
process.env['FRODO_MASTER_KEY_PATH'] =
  './test/e2e/env/masterkey.key';
const env = getEnv();

beforeAll(() => {
  writeFileSync(connectionsDeleteFile, readFileSync(connectionsFile));
});

afterAll(() => {
  rmSync(connectionsDeleteFile);
});

describe('frodo conn delete', () => {
  testif(process.env['FRODO_MASTER_KEY'])(
    `"frodo conn delete ${c.host}": should delete the connection profile`,
    async () => {
      const CMD = `frodo conn delete ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );
});
