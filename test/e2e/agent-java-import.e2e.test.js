import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaJavaAgentsFileName = "allAlphaAgents.java.agent.json";
const allAlphaJavaAgentsExport = `${allDirectory}/${allAlphaJavaAgentsFileName}`;
const allSeparateJavaAgentsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/agent`;

describe('frodo agent java import', () => {
    test(`"frodo agent java import -i frodo-test-java-agent -f ${allAlphaJavaAgentsExport}": should import the agent with the id "frodo-test-java-agent" from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import -i frodo-test-java-agent -f ${allAlphaJavaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import --agent-id frodo-test-java-agent --file ${allAlphaJavaAgentsExport}": should import the agent with the id "frodo-test-java-agent" from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import --agent-id frodo-test-java-agent --file ${allAlphaJavaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import -i frodo-test-java-agent -f ${allAlphaJavaAgentsFileName} -D ${allDirectory}": should import the agent with the id "frodo-test-java-agent" from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import -i frodo-test-java-agent -f ${allAlphaJavaAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import -f ${allAlphaJavaAgentsExport}": should import the first agent from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import -f ${allAlphaJavaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import --file ${allAlphaJavaAgentsExport}": should import the first agent from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import --file ${allAlphaJavaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import -f ${allAlphaJavaAgentsFileName} -D ${allDirectory}": should import the first agent from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import -f ${allAlphaJavaAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import -af ${allAlphaJavaAgentsExport}": should import all agents from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import -af ${allAlphaJavaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import --all --file ${allAlphaJavaAgentsExport}": should import all agents from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import --all --file ${allAlphaJavaAgentsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import -af ${allAlphaJavaAgentsFileName} -D ${allDirectory}": should import all agents from the file "${allAlphaJavaAgentsExport}"`, async () => {
        const CMD = `frodo agent java import -af ${allAlphaJavaAgentsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import -AD ${allSeparateJavaAgentsDirectory}": should import all agents from the ${allSeparateJavaAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent java import -AD ${allSeparateJavaAgentsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo agent java import --all-separate --directory ${allSeparateJavaAgentsDirectory}": should import all agents from the ${allSeparateJavaAgentsDirectory} directory"`, async () => {
        const CMD = `frodo agent java import --all-separate --directory ${allSeparateJavaAgentsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
