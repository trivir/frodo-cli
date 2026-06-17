import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes, testif } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';
import { writeFileSync, rmSync } from 'fs';

const exec = promisify(cp.exec);

const connectionsUpdateFile = './test/e2e/env/ConnectionsUpdate.json';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/ConnectionsUpdate.json';
process.env['FRODO_MASTER_KEY_PATH'] =
  './test/e2e/env/masterkey.key';
const env = getEnv(c);

const jwkFile = 'test/fs_tmp/conn-update-jwk.json';

beforeAll(() => {
  writeFileSync(jwkFile, c.saJwk);
  writeFileSync(connectionsUpdateFile, '{}');
});

afterAll(() => {
  rmSync(jwkFile);
  rmSync(connectionsUpdateFile);
});

describe('frodo conn update', () => {
  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --sa-id ${c.saId} --sa-jwk-file ${jwkFile} ${c.host}": update connection profile with service account credentials.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --sa-id ${c.saId} --sa-jwk-file ${jwkFile} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --username ${c.user} --password ${c.pass} ${c.host}": update connection profile with user account credentials.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --username ${c.user} --password ${c.pass} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --log-api-key ${c.logApiKey} --log-api-secret ${c.logApiSecret} ${c.host}": update connection profile with log API credentials.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --log-api-key ${c.logApiKey} --log-api-secret ${c.logApiSecret} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --sa-id ${c.saId} --sa-jwk-file ${jwkFile} --username ${c.user} --password ${c.pass} ${c.host}": update connection profile with service account and user account credentials.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --sa-id ${c.saId} --sa-jwk-file ${jwkFile} --username ${c.user} --password ${c.pass} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --sa-id ${c.saId} --sa-jwk-file ${jwkFile} --log-api-key ${c.logApiKey} --log-api-secret ${c.logApiSecret} ${c.host}": update connection profile with service account and log API credentials.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --sa-id ${c.saId} --sa-jwk-file ${jwkFile} --log-api-key ${c.logApiKey} --log-api-secret ${c.logApiSecret} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --sa-id ${c.saId} ${c.host}": should error when sa-id is provided without sa-jwk-file.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --sa-id ${c.saId} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --username ${c.user} ${c.host}": should error when username is provided without password.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --username ${c.user} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts --log-api-key ${c.logApiKey} ${c.host}": should error when log-api-key is provided without log-api-secret.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts --log-api-key ${c.logApiKey} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn update --skip-prompts ${c.host}": should print no-op message when no credential flags are provided.`,
    async () => {
      const CMD = `frodo conn update --skip-prompts ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );
});