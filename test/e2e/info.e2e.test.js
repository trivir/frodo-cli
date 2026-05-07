import cp from 'child_process';
import { promisify } from 'util';
import {getEnv, removeAnsiEscapeCodes} from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';
import { rmSync, writeFileSync } from 'fs';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const jwkFile = 'test/fs_tmp/info-jwk.json';

beforeAll(() => {
  writeFileSync(jwkFile, c.saJwk);
});

afterAll(() => {
  rmSync(jwkFile);
});

describe('frodo info', () => {
  describe('Authenticate as user', () => {
    test.skip(`frodo info <host> <user> <pass>`, async () => {
      const CMD = `frodo info ${c.host} ${c.user} ${c.pass}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

    test.skip(`frodo info <host> <user> <pass> --json`, async () => {
      const CMD = `frodo info ${c.host} ${c.user} ${c.pass} --json`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test.skip(`frodo info <host> <user> <pass> --scriptFriendly`, async () => {
      const CMD = `frodo info ${c.host} ${c.user} ${c.pass} --scriptFriendly`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test.skip(`frodo info <host> <user> <pass> -s`, async () => {
      const CMD = `frodo info ${c.host} ${c.user} ${c.pass} -s`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
  });

  describe('Authenticate as service account using cli args', () => {
    test(`frodo info <host> --sa-id <sa-id> --sa-jwk-file <sa-jwk-file>`, async () => {
      const CMD = `frodo info ${c.host} --sa-id ${c.saId} --sa-jwk-file ${jwkFile}`;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

    test(`frodo info <host> --sa-id <sa-id> --sa-jwk-file <sa-jwk-file> --json`, async () => {
      const CMD = `frodo info ${c.host} --sa-id ${c.saId} --sa-jwk-file ${jwkFile} --json`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`frodo info <host> --sa-id <sa-id> --sa-jwk-file <sa-jwk-file> --scriptFriendly`, async () => {
      const CMD = `frodo info ${c.host} --sa-id ${c.saId} --sa-jwk-file ${jwkFile} --scriptFriendly`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`frodo info <host> --sa-id <sa-id> --sa-jwk-file <sa-jwk-file> -s`, async () => {
      const CMD = `frodo info ${c.host} --sa-id ${c.saId} --sa-jwk-file ${jwkFile} -s`;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
  });

  describe('Authenticate as service account using env vars', () => {
    test(`frodo info`, async () => {
      const CMD = `frodo info`;
      env.env.FRODO_HOST = c.host;
      env.env.FRODO_SA_ID = c.saId;
      env.env.FRODO_SA_JWK = c.saJwk;
      const { stderr } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

    test(`frodo info --json`, async () => {
      const CMD = `frodo info --json`;
      env.env.FRODO_HOST = c.host;
      env.env.FRODO_SA_ID = c.saId;
      env.env.FRODO_SA_JWK = c.saJwk;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`frodo info --scriptFriendly`, async () => {
      const CMD = `frodo info --scriptFriendly`;
      env.env.FRODO_HOST = c.host;
      env.env.FRODO_SA_ID = c.saId;
      env.env.FRODO_SA_JWK = c.saJwk;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`frodo info -s`, async () => {
      const CMD = `frodo info -s`;
      env.env.FRODO_HOST = c.host;
      env.env.FRODO_SA_ID = c.saId;
      env.env.FRODO_SA_JWK = c.saJwk;
      const { stdout } = await exec(CMD, env);
      expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
  });
});
