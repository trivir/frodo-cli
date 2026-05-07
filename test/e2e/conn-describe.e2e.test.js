import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes, testif } from './utils/TestUtils';
import { connection as c, amster_connection as cc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo conn describe', () => {
    testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
        `"frodo conn describe ${c.host}": should describe the connection`,
        async () => {
            const CMD = `frodo conn describe ${c.host}`;
            const { stdout } = await exec(CMD, env);
            expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
        }
    );

    testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
        `"frodo conn describe ${cc.host}": should describe the classic connection`,
        async () => {
            const CMD = `frodo conn describe ${cc.host}`;
            const { stdout } = await exec(CMD, classicEnv);
            expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
        }
    );

    testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
        `"frodo conn describe --show-secrets ${c.host}": should describe the connection and show the associated secrets`,
        async () => {
            const CMD = `frodo conn describe --show-secrets ${c.host}`;
            const { stdout } = await exec(CMD, env);
            //Don't test with snapshot, otherwise the snapshot would contain secrets. Instead, just check to make sure "[present]" doesn't exist anywhere.
            expect(removeAnsiEscapeCodes(stdout).includes("[present]")).toBeFalsy();
        }
    );

    testif(process.env['FRODO_MASTER_KEY'] || process.env['FRODO_MASTER_KEY_PATH'])(
        `"frodo conn describe --show-secrets ${cc.host}": should describe the classic connection and show the associated secrets`,
        async () => {
            const CMD = `frodo conn describe --show-secrets ${cc.host}`;
            const { stdout } = await exec(CMD, classicEnv);
            //Don't test with snapshot, otherwise the snapshot would contain secrets. Instead, just check to make sure "[present]" doesn't exist anywhere.
            expect(removeAnsiEscapeCodes(stdout).includes("[present]")).toBeFalsy();
        }
    );
});
