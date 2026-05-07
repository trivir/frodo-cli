import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { classic_connection as cc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const classicEnv = getEnv(cc);

const allDirectory = "test/e2e/exports/all";
const allServersFileName = "allServers.server.json";
const allServersExport = `${allDirectory}/${allServersFileName}`;
const allSeparateServersDirectory = `test/e2e/exports/all-separate/classic/global/server`;

describe('frodo server import', () => {

    test(`"frodo server import -di 01 -f ${allServersExport}": should import the server with the id "01" from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import -di 01 -f ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import --server-id 01 --file ${allServersExport}": should import the server with the id "01" from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import --server-id 01 --file ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import -u 8081 -f ${allServersExport}": should import the server with the url containing "8081" from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import -u 8081 -f ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import --default  --server-url http://localhost:8081/am --file ${allServersExport}": should import the server with the url "http://localhost:8081/am" from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import --default --server-url http://localhost:8081/am --file ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import -f ${allServersExport}": should import the first server from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import -f ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import -daf ${allServersExport}": should import all servers from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import -daf ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import --all --file ${allServersExport}": should import all servers from the file "${allServersExport}"`, async () => {
        const CMD = `frodo server import --all --file ${allServersExport}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import -dAD ${allSeparateServersDirectory}": should import all servers from the ${allSeparateServersDirectory} directory"`, async () => {
        const CMD = `frodo server import -dAD ${allSeparateServersDirectory}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo server import --all-separate --directory ${allSeparateServersDirectory}": should import all servers from the ${allSeparateServersDirectory} directory"`, async () => {
        const CMD = `frodo server import --all-separate --directory ${allSeparateServersDirectory}`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
