import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const type = 'variable';

describe('frodo esv variable export', () => {
    test('"frodo esv variable export --variable-id esv-test-var": should export the variable with variable id "esv-test-var"', async () => {
        const exportFile = "esv-test-var.variable.json";
        const CMD = `frodo esv variable export --variable-id esv-test-var`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -i esv-test-var -f my-esv-test-var.variable.json --no-decode": should export the variable with variable id "esv-test-var" into file named my-esv-test-var.variable.json', async () => {
        const exportFile = "my-esv-test-var.variable.json";
        const CMD = `frodo esv variable export -i esv-test-var -f ${exportFile} --no-decode`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -MNi esv-test-var -D variableExportTestDir1": should export the variable with variable id "esv-test-var" into the directory named variableExportTestDir1', async () => {
        const exportDirectory = "variableExportTestDir1";
        const CMD = `frodo esv variable export -MNi esv-test-var -D ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo esv variable export --all": should export all variables to a single file', async () => {
        const exportFile = "allVariables.variable.json";
        const CMD = `frodo esv variable export --all`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -a --file my-allVariables.variable.json --no-decode": should export all variables to a single file named my-allVariables.variable.json', async () => {
        const exportFile = "my-allVariables.variable.json";
        const CMD = `frodo esv variable export -a --file ${exportFile} --no-decode`;
        await testExport(CMD, env, type, exportFile);
    });

    test('"frodo esv variable export -MNaD variableExportTestDir2": should export all variables to a single file in the directory variableExportTestDir2', async () => {
        const exportDirectory = "variableExportTestDir2";
        const CMD = `frodo esv variable export -MNaD ${exportDirectory}`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });

    test('"frodo esv variable export -A": should export all variables to separate files', async () => {
        const CMD = `frodo esv variable export -A`;
        await testExport(CMD, env, type);
    });

    test('"frodo esv variable export --modified-properties --all-separate --no-metadata --directory variableExportTestDir3 --no-decode": should export all variables to separate files in the directory variableExportTestDir3', async () => {
        const exportDirectory = "variableExportTestDir3";
        const CMD = `frodo esv variable export --modified-properties --all-separate --no-metadata --directory ${exportDirectory} --no-decode`;
        await testExport(CMD, env, type, undefined, exportDirectory, false);
    });
});
