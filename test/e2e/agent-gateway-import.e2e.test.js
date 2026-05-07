import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaGatewayAgentsFileName = "allAlphaAgents.gateway.agent.json";
const allAlphaGatewayAgentsExport = `${allDirectory}/${allAlphaGatewayAgentsFileName}`;
const allSeparateGatewayAgentsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/agent`;

describe('frodo agent gateway import', () => {
    test(`"frodo agent gateway import -i frodo-test-ig-agent -f ${allAlphaGatewayAgentsExport}": should import the agent with the id "frodo-test-ig-agent" from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import -i frodo-test-ig-agent -f ${allAlphaGatewayAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import --agent-id frodo-test-ig-agent --file ${allAlphaGatewayAgentsExport}": should import the agent with the id "frodo-test-ig-agent" from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import --agent-id frodo-test-ig-agent --file ${allAlphaGatewayAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import -i frodo-test-ig-agent -f ${allAlphaGatewayAgentsFileName} -D ${allDirectory}": should import the agent with the id "frodo-test-ig-agent" from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import -i frodo-test-ig-agent -f ${allAlphaGatewayAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import -f ${allAlphaGatewayAgentsExport}": should import the first agent from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import -f ${allAlphaGatewayAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import --file ${allAlphaGatewayAgentsExport}": should import the first agent from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import --file ${allAlphaGatewayAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import -f ${allAlphaGatewayAgentsFileName} -D ${allDirectory}": should import the first agent from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import -f ${allAlphaGatewayAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import -af ${allAlphaGatewayAgentsExport}": should import all agents from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import -af ${allAlphaGatewayAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import --all --file ${allAlphaGatewayAgentsExport}": should import all agents from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import --all --file ${allAlphaGatewayAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import -af ${allAlphaGatewayAgentsFileName} -D ${allDirectory}": should import all agents from the file "${allAlphaGatewayAgentsExport}"`, async () => {
        const CMD = `frodo agent gateway import -af ${allAlphaGatewayAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import -AD ${allSeparateGatewayAgentsDirectory}": should import all agents from the ${allSeparateGatewayAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent gateway import -AD ${allSeparateGatewayAgentsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent gateway import --all-separate --directory ${allSeparateGatewayAgentsDirectory}": should import all agents from the ${allSeparateGatewayAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent gateway import --all-separate --directory ${allSeparateGatewayAgentsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
