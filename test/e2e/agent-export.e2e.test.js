import { getEnv, testExport } from './utils/TestUtils';
import {classic_connection as cc, connection as c} from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

const type = 'agent';

describe('frodo agent export', () => {
    test('"frodo agent export --agent-id frodo-test-java-agent": should export the agent with agent id "frodo-test-java-agent"', async () => {
        const exportFile = "frodo-test-java-agent.java.agent.json";
        const CMD = `frodo agent export --agent-id frodo-test-java-agent`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent export -i frodo-test-web-agent -f my-frodo-test-web-agent.agent.json": should export the agent with agent id "frodo-test-web-agent" into file named my-frodo-test-web-agent.agent.json', async () => {
        const exportFile = "my-frodo-test-web-agent.agent.json";
        const CMD = `frodo agent export -i frodo-test-web-agent -f ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent export -Ni frodo-test-web-agent -D agentExportTestDir1": should export the agent with agent id "frodo-test-web-agent" into the directory named agentExportTestDir1', async () => {
        const exportDirectory = "agentExportTestDir1";
        const CMD = `frodo agent export -Ni frodo-test-web-agent -D ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent export --all": should export all agents to a single file', async () => {
        const exportFile = "allAlphaAgents.agent.json";
        const CMD = `frodo agent export --all`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent export -a --file my-allAlphaAgents.agent.json": should export all agents to a single file named my-allAlphaAgents.agent.json', async () => {
        const exportFile = "my-allAlphaAgents.agent.json";
        const CMD = `frodo agent export -a --file ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent export -NaD agentExportTestDir2": should export all agents to a single file in the directory agentExportTestDir2', async () => {
        const exportDirectory = "agentExportTestDir2";
        const CMD = `frodo agent export -NaD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent export -AD agentExportTestDir4": should export all agents to separate files in the directory agentExportTestDir4', async () => {
        const exportDirectory = "agentExportTestDir4";
        const CMD = `frodo agent export -AD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent export --all-separate --no-metadata --directory agentExportTestDir3": should export all agents to separate files in the directory agentExportTestDir3', async () => {
        const exportDirectory = "agentExportTestDir3";
        const CMD = `frodo agent export --all-separate --no-metadata --directory ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent export -i AgentService -gm classic": should export the global agent with agent id "AgentService"', async () => {
        const exportFile = "AgentService.agent.json";
        const CMD = `frodo agent export -i AgentService -gm classic`;
        await testExport(CMD, classicEnv, type, exportFile);
    });

    test('"frodo agent export -aD agentExportTestDir5 -gm classic": should export all global agents to a single file in the directory agentExportTestDir5', async () => {
        const exportDirectory = "agentExportTestDir5";
        const CMD = `frodo agent export -aD ${exportDirectory} -gm classic`;
        await testExport(CMD, classicEnv, type, undefined, exportDirectory, false);
    });

    test('"frodo agent export -AD agentExportTestDir6 --global --type classic": should export all global agents to separate files in the directory agentExportTestDir6', async () => {
        const exportDirectory = "agentExportTestDir6";
        const CMD = `frodo agent export -AD ${exportDirectory} --global --type classic`;
        await testExport(CMD, classicEnv, type, undefined, exportDirectory, false);
    });
});
