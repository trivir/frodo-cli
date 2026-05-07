import cp from 'child_process';
import { promisify } from 'util';
import {getEnv, removeAnsiEscapeCodes, testif} from './utils/TestUtils';
import { connection as c, amster_connection as cc } from './utils/TestConfig';
import { writeFileSync, rmSync } from 'fs';

const exec = promisify(cp.exec);

const connectionsSaveFile = './test/e2e/env/ConnectionsSave.json';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
  './test/e2e/env/ConnectionsSave.json';
process.env['FRODO_MASTER_KEY_PATH'] =
  './test/e2e/env/masterkey.key';
const env = getEnv(c);
const classicEnv = getEnv(cc);

const jwkFile = 'test/fs_tmp/conn-save-jwk.json';
const pkFile = 'test/fs_tmp/conn-save-pk';

beforeAll(() => {
  writeFileSync(jwkFile, c.saJwk);
  writeFileSync(pkFile, cc.pk);
  writeFileSync(connectionsSaveFile, '{}');
});

afterAll(() => {
  rmSync(jwkFile);
  rmSync(pkFile);
  rmSync(connectionsSaveFile);
});

describe('frodo conn save', () => {
  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn save --no-validate ${c.host} ${c.user} ${c.pass}": save new connection profile using an admin account.`,
    async () => {
      const CMD = `frodo conn save --no-validate ${c.host} ${c.user} ${c.pass}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn save --no-validate --sa-id ${c.saId} --sa-jwk-file ${jwkFile} ${c.host}": save new connection profile with existing service account and without admin account.`,
    async () => {
      const CMD = `frodo conn save --no-validate --sa-id ${c.saId} --sa-jwk-file ${jwkFile} ${c.host}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn save --no-validate ${cc.host} ${cc.user} ${cc.pass}": save new classic connection profile using an admin account.`,
    async () => {
      const CMD = `frodo conn save --no-validate ${cc.host} ${cc.user} ${cc.pass}`;
      const { stderr } = await exec(CMD, classicEnv);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );

  testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
    `"frodo conn save --no-validate --private-key ${pkFile} --authentication-service ${cc.authService} ${cc.host}": save new classic connection profile with private key and custom authentication service.`,
    async () => {
      const CMD = `frodo conn save --no-validate --private-key ${pkFile} --authentication-service ${cc.authService} ${cc.host}`;
      const { stderr } = await exec(CMD, classicEnv);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    }
  );
});
