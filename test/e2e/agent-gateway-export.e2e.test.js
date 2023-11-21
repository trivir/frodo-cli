/**
 * Follow this process to write e2e tests for the CLI project:
 *
 * 1. Test if all the necessary mocks for your tests already exist.
 *    In mock mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=1 frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    If your command completes without errors and with the expected results,
 *    all the required mocks already exist and you are good to write your
 *    test and skip to step #4.
 *
 *    If, however, your command fails and you see errors like the one below,
 *    you know you need to record the mock responses first:
 *
 *    [Polly] [adapter:node-http] Recording for the following request is not found and `recordIfMissing` is `false`.
 *
 * 2. Record mock responses for your exact command.
 *    In mock record mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=record frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    Wait until you see all the Polly instances (mock recording adapters) have
 *    shutdown before you try to run step #1 again.
 *    Messages like these indicate mock recording adapters shutting down:
 *
 *    Polly instance 'conn/4' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 2s...
 *    Polly instance 'conn/save/3' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 1s...
 *    Polly instance 'conn/save/3' stopping in 2s...
 *    Polly instance 'conn/4' stopped.
 *    Polly instance 'conn/save/3' stopping in 1s...
 *    Polly instance 'conn/save/3' stopped.
 *
 * 3. Validate your freshly recorded mock responses are complete and working.
 *    Re-run the exact command you want to test in mock mode (see step #1).
 *
 * 4. Write your test.
 *    Make sure to use the exact command including number of arguments and params.
 *
 * 5. Commit both your test and your new recordings to the repository.
 *    Your tests are likely going to reside outside the frodo-lib project but
 *    the recordings must be committed to the frodo-lib project.
 */

/*
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export --agent-id frodo-test-ig-agent
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export -i frodo-test-ig-agent -f my-frodo-test-ig-agent.gateway.agent.json.json
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export -SNi frodo-test-ig-agent -D agentGatewayExportTestDir1
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export --all
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export -a --file my-allAlphaAgents.gateway.agent.json
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export -SNaD agentGatewayExportTestDir2
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export -A
FRODO_MOCK=record FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo agent gateway export --all-separate --sort --no-metadata --directory agentGatewayExportTestDir3
*/
import { testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = {
    env: process.env,
};
env.env.FRODO_HOST = c.host;
env.env.FRODO_SA_ID = c.saId;
env.env.FRODO_SA_JWK = c.saJwk;

const type = 'gateway.agent';

describe('frodo agent gateway export', () => {
    test('"frodo agent gateway export --agent-id frodo-test-ig-agent": should export the gateway agent with agent id "frodo-test-ig-agent"', async () => {
        const exportFile = "frodo-test-ig-agent.gateway.agent.json";
        const CMD = `frodo agent gateway export --agent-id frodo-test-ig-agent`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent gateway export -i frodo-test-ig-agent -f my-frodo-test-ig-agent.gateway.agent.json.json": should export the gateway agent with agent id "frodo-test-ig-agent" into file named my-frodo-test-ig-agent.gateway.agent.json', async () => {
        const exportFile = "my-frodo-test-ig-agent.gateway.agent.json.json";
        const CMD = `frodo agent gateway export -i frodo-test-ig-agent -f ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent gateway export -SNi frodo-test-ig-agent -D agentGatewayExportTestDir1": should export the gateway agent with agent id "frodo-test-ig-agent" into the directory named agentGatewayExportTestDir1', async () => {
        const exportDirectory = "agentGatewayExportTestDir1";
        const CMD = `frodo agent gateway export -SNi frodo-test-ig-agent -D ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent gateway export --all": should export all gateway agents to a single file', async () => {
        const exportFile = "allAlphaAgents.gateway.agent.json";
        const CMD = `frodo agent gateway export --all`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent gateway export -a --file my-allAlphaAgents.gateway.agent.json": should export all gateway agents to a single file named my-allAlphaAgents.gateway.agent.json', async () => {
        const exportFile = "my-allAlphaAgents.gateway.agent.json";
        const CMD = `frodo agent gateway export -a --file ${exportFile}`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo agent gateway export -SNaD agentGatewayExportTestDir2": should export all gateway agents to a single file in the directory agentGatewayExportTestDir2', async () => {
        const exportDirectory = "agentGatewayExportTestDir2";
        const CMD = `frodo agent gateway export -SNaD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo agent gateway export -A": should export all gateway agents to separate files', async () => {
        const CMD = `frodo agent gateway export -A`;
        await testExport(CMD, env, type);
    });

    test('"frodo agent gateway export --all-separate --sort --no-metadata --directory agentGatewayExportTestDir3": should export all gateway agents to separate files in the directory agentGatewayExportTestDir3', async () => {
        const exportDirectory = "agentGatewayExportTestDir3";
        const CMD = `frodo agent gateway export --all-separate --sort --no-metadata --directory agentGatewayExportTestDir3`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });
});
