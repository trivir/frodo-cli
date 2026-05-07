import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const syncType = 'sync';
const mappingType = 'mapping';

describe('frodo mapping export', () => {
    test('"frodo mapping export --mapping-id sync/managedAlpha_user_managedBravo_user": should export the mapping with mapping id "sync/managedAlpha_user_managedBravo_user"', async () => {
        const exportFile = "managedAlpha_user_managedBravo_user.sync.json";
        const CMD = `frodo mapping export --mapping-id sync/managedAlpha_user_managedBravo_user`;
        await testExport(CMD, env, syncType, exportFile);
    });

    test('"frodo mapping export -i mapping/managedBravo_group_managedBravo_group -f my-frodo-test-mapping.mapping.json": should export the mapping with mapping id "mapping/managedBravo_group_managedBravo_group" into file named my-frodo-test-mapping.mapping.json', async () => {
        const exportFile = "my-frodo-test-mapping.mapping.json";
        const CMD = `frodo mapping export -i mapping/managedBravo_group_managedBravo_group -f ${exportFile}`;
        await testExport(CMD, env, mappingType, exportFile);
    });

    test('"frodo mapping export -Ni mapping/managedBravo_group_managedBravo_group --no-deps --use-string-arrays -D mappingExportTestDir1": should export the mapping with mapping id "mapping/managedBravo_group_managedBravo_group" into the directory named mappingExportTestDir1', async () => {
        const exportDirectory = "mappingExportTestDir1";
        const CMD = `frodo mapping export -Ni mapping/managedBravo_group_managedBravo_group --no-deps --use-string-arrays -D ${exportDirectory}`;
        await testExport(CMD, env, mappingType, undefined, exportDirectory, false);
    });

    test('"frodo mapping export --all": should export all mappings to a single file', async () => {
        const exportFile = "allMappings.mapping.json";
        const CMD = `frodo mapping export --all`;
        await testExport(CMD, env, mappingType, exportFile);
    });

    test('"frodo mapping export -a --file my-allMappings.mapping.json": should export all mappings to a single file named my-allMappings.mapping.json', async () => {
        const exportFile = "my-allMappings.mapping.json";
        const CMD = `frodo mapping export -a --file ${exportFile}`;
        await testExport(CMD, env, mappingType, exportFile);
    });

    test('"frodo mapping export --no-deps --use-string-arrays -c GoogleApps -t alpha_user -NaD mappingExportTestDir2": should export all mappings to a single file in the directory mappingExportTestDir2', async () => {
        const exportDirectory = "mappingExportTestDir2";
        const CMD = `frodo mapping export --no-deps --use-string-arrays -c GoogleApps -t alpha_user -NaD ${exportDirectory}`;
        await testExport(CMD, env, mappingType, undefined, exportDirectory, false);
    });

    test('"frodo mapping export -AD mappingExportTestDir4": should export all mappings to separate files in the mappingExportTestDir4 directory', async () => {
        const exportDirectory = "mappingExportTestDir4";
        const CMD = `frodo mapping export -AD ${exportDirectory}`;
        await testExport(CMD, env, undefined, undefined, exportDirectory, false);
    });

    test('"frodo mapping export --no-deps --use-string-arrays --connector-id GoogleApps --managed-object-type alpha_user --all-separate --no-metadata --directory mappingExportTestDir3": should export all mappings to separate files in the directory mappingExportTestDir3', async () => {
        const exportDirectory = "mappingExportTestDir3";
        const CMD = `frodo mapping export --no-deps --use-string-arrays --connector-id GoogleApps --managed-object-type alpha_user --all-separate --no-metadata --directory ${exportDirectory}`;
        await testExport(CMD, env, undefined, undefined, exportDirectory, false);
    });
});
