import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import {classic_connection as cc, connection as c} from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

describe('frodo agent list', () => {
    test('"frodo agent list": should list the ids of the agents', async () => {
        const CMD = `frodo agent list`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent list -l": should list the ids, statuses, and types of the agents', async () => {
        const CMD = `frodo agent list -l`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent list -gm classic": should list the ids of the global agents', async () => {
        const CMD = `frodo agent list -gm classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo agent list --global --long --type classic": should list the ids, statuses, and types of the global agents', async () => {
        const CMD = `frodo agent list --global --long --type classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
