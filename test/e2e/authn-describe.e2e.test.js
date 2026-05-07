import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';
import { promisify } from "util";
import cp from "child_process";

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo authn describe', () => {
    test('"frodo authn describe": should describe authentication settings', async () => {
        const CMD = `frodo authn describe`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authn describe --json": should describe authentication settings in json format', async () => {
        const CMD = `frodo authn describe --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authn describe -gm classic": should describe global authentication settings', async () => {
        const CMD = `frodo authn describe -gm classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authn describe --global --json --type classic": should describe global authentication settings in json format', async () => {
        const CMD = `frodo authn describe --global --json --type classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
