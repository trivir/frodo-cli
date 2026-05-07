import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

const allDirectory = "test/e2e/exports/all";
const allAlphaAgentsFileName = "allAlphaAgents.agent.json";
const allGlobalAgentsFileName = "allGlobalAgents.agent.json";
const allAlphaAgentsExport = `${allDirectory}/${allAlphaAgentsFileName}`;
const allGlobalAgentsExport = `${allDirectory}/${allGlobalAgentsFileName}`;
const allSeparateAgentsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/agent`;
const allSeparateGlobalAgentsDirectory = `test/e2e/exports/all-separate/classic/global/agent`;

describe('frodo agent import', () => {
    test(`"frodo agent import -i frodo-test-ig-agent -f ${allAlphaAgentsExport}": should import the agent with the id "frodo-test-ig-agent" from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import -i frodo-test-ig-agent -f ${allAlphaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import --agent-id frodo-test-ig-agent --file ${allAlphaAgentsExport}": should import the agent with the id "frodo-test-ig-agent" from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import --agent-id frodo-test-ig-agent --file ${allAlphaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -i frodo-test-ig-agent -f ${allAlphaAgentsFileName} -D ${allDirectory}": should import the agent with the id "frodo-test-ig-agent" from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import -i frodo-test-ig-agent -f ${allAlphaAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -f ${allAlphaAgentsExport}": should import the first agent from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import -f ${allAlphaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import --file ${allAlphaAgentsExport}": should import the first agent from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import --file ${allAlphaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -f ${allAlphaAgentsFileName} -D ${allDirectory}": should import the first agent from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import -f ${allAlphaAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -af ${allAlphaAgentsExport}": should import all agents from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import -af ${allAlphaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import --all --file ${allAlphaAgentsExport}": should import all agents from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import --all --file ${allAlphaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -af ${allAlphaAgentsFileName} -D ${allDirectory}": should import all agents from the file "${allAlphaAgentsExport}"`, async () => {
        const CMD = `frodo agent import -af ${allAlphaAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -AD ${allSeparateAgentsDirectory}": should import all agents from the ${allSeparateAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent import -AD ${allSeparateAgentsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import --all-separate --directory ${allSeparateAgentsDirectory}": should import all agents from the ${allSeparateAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent import --all-separate --directory ${allSeparateAgentsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -i AgentService -gf ${allGlobalAgentsExport} -m classic": should import the global agent with the id "AgentService" from the file "${allGlobalAgentsExport}"`, async () => {
        const CMD = `frodo agent import -i AgentService -gf ${allGlobalAgentsExport} -m classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -gf ${allGlobalAgentsExport} -m classic": should import the first global agent from the file "${allGlobalAgentsExport}"`, async () => {
        const CMD = `frodo agent import -gf ${allGlobalAgentsExport} -m classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import -gaf ${allGlobalAgentsExport} -m classic": should import all global agents from the file "${allGlobalAgentsExport}"`, async () => {
        const CMD = `frodo agent import -gaf ${allGlobalAgentsExport} -m classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent import --global -AD ${allSeparateGlobalAgentsDirectory} --type classic": should import all global agents from the ${allSeparateGlobalAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent import --global -AD ${allSeparateGlobalAgentsDirectory} --type classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
