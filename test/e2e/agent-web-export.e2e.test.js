import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const type = 'web.agent';

describe('frodo agent web export', () => {
    test('"frodo agent web export --agent-id frodo-test-web-agent": should export the web agent with agent id "frodo-test-web-agent"', async () => {
        const exportFile = "frodo-test-web-agent.web.agent.json";
        const CMD = `frodo agent web export --agent-id frodo-test-web-agent`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent web export -i frodo-test-web-agent -f my-frodo-test-web-agent.web.agent.json": should export the web agent with agent id "frodo-test-web-agent" into file named test.json', async () => {
        const exportFile = "my-frodo-test-web-agent.web.agent.json";
        const CMD = `frodo agent web export -i frodo-test-web-agent -f ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent web export -Ni frodo-test-web-agent -D agentWebExportTestDir1": should export the web agent with agent id "frodo-test-web-agent" into the directory agentWebExportTestDir1', async () => {
        const exportDirectory = "agentWebExportTestDir1";
        const CMD = `frodo agent web export -Ni frodo-test-web-agent -D ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent web export --all": should export all web agents to a single file', async () => {
        const exportFile = "allAlphaAgents.web.agent.json";
        const CMD = `frodo agent web export --all`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent web export -NaD agentWebExportTestDir2": should export all web agents to a single file in the directory agentWebExportTestDir2', async () => {
        const exportDirectory = "agentWebExportTestDir2";
        const CMD = `frodo agent web export -NaD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent web export -A": should export all web agents to separate files', async () => {
        const CMD = `frodo agent web export -A`;
        await testExport(CMD, env, type);
    });

    test('"frodo agent web export --all-separate --no-metadata --directory agentWebExportTestDir3": should export all web agents to separate files in the directory agentWebExportTestDir3', async () => {
        const exportDirectory = "agentWebExportTestDir3";
        const CMD = `frodo agent web export --all-separate --no-metadata --directory ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });
});
