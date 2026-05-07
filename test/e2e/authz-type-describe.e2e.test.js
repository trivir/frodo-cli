import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo authz type describe', () => {
    test('"frodo authz type describe -i 76656a38-5f8e-401b-83aa-4ccb74ce88d2": should describe the 76656a38-5f8e-401b-83aa-4ccb74ce88d2 resource type', async () => {
        const CMD = `frodo authz type describe -i 76656a38-5f8e-401b-83aa-4ccb74ce88d2`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz type describe --type-id 76656a38-5f8e-401b-83aa-4ccb74ce88d2": should describe the 76656a38-5f8e-401b-83aa-4ccb74ce88d2 resource type', async () => {
        const CMD = `frodo authz type describe --type-id 76656a38-5f8e-401b-83aa-4ccb74ce88d2`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz type describe -i 76656a38-5f8e-401b-83aa-4ccb74ce88d2 --json": should describe the 76656a38-5f8e-401b-83aa-4ccb74ce88d2 resource type in json', async () => {
        const CMD = `frodo authz type describe -i 76656a38-5f8e-401b-83aa-4ccb74ce88d2 --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz type describe -n URL": should describe the URL resource type', async () => {
        const CMD = `frodo authz type describe -n URL`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz type describe --type-name URL": should describe the URL resource type', async () => {
        const CMD = `frodo authz type describe --type-name URL`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test('"frodo authz type describe -n URL --json": should describe the URL resource type in json', async () => {
        const CMD = `frodo authz type describe -n URL --json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
