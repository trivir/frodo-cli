import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes, testif } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';
import { readFileSync, rmSync, writeFileSync } from 'fs';

const exec = promisify(cp.exec);
const connectionsFile = './test/e2e/env/Connections.json';
const connectionsAliasFile = './test/e2e/env/ConnectionsAddAlias.json';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] = connectionsAliasFile;
process.env['FRODO_MASTER_KEY_PATH'] =
  './test/e2e/env/masterkey.key';
const env = getEnv();
const alias = 'testname';

beforeAll(() => {
  writeFileSync(connectionsAliasFile, readFileSync(connectionsFile));
});

afterAll(() => {
  rmSync(connectionsAliasFile);
});

describe('frodo conn alias add', () => {
  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn alias add ${alias} ${c.host}": should add an alias 'testname' to the connection profile`,
    async () => {
      const CMD = `frodo conn alias add ${alias} ${c.host}`;
      const { stdout, stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );
  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn alias add ${alias} ${c.host}": should fail to add alias and warn user the alias is already in use`,
    async () => {
      const profiles = JSON.parse(readFileSync(connectionsAliasFile, 'utf-8'));
      profiles['example.com'] = {
        ...profiles[c.host],
        host: 'example.com',
        alias: alias,
      };
      writeFileSync(connectionsAliasFile, JSON.stringify(profiles, null, 2));
      const CMD = `frodo conn alias add ${alias} ${c.host}`;
      try {
        await exec(CMD, env);
        throw new Error('Expected command to fail');
      } catch (e) {
        expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
        expect(removeAnsiEscapeCodes(e.stdout)).toMatchSnapshot();
      }
      expect.assertions(2);
    }
  );
});
