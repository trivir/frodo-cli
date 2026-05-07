import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allMappingsFileName = "allMappings.mapping.json";
const allMappingsExport = `${allDirectory}/${allMappingsFileName}`;
const allSeparateMappingsDirectory = `test/e2e/exports/all-separate/cloud/global/idm`;

describe('frodo mapping import', () => {
    test(`"frodo mapping import -i sync/managedAlpha_application_managedBravo_application -f ${allMappingsExport}": should import the mapping with the id "sync/managedAlpha_application_managedBravo_application" from the file "${allMappingsExport}"`, async () => {
        const CMD = `frodo mapping import -i sync/managedAlpha_application_managedBravo_application -f ${allMappingsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import --no-deps --mapping-id mapping/managedBravo_group_managedBravo_group --file ${allMappingsFileName} -D ${allDirectory}": should import the mapping with the id "mapping/managedBravo_group_managedBravo_group" from the file "${allMappingsExport}"`, async () => {
        const CMD = `frodo mapping import --no-deps --mapping-id mapping/managedBravo_group_managedBravo_group --file ${allMappingsFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import -f ${allMappingsExport}": should import the first mapping from the file "${allMappingsExport}"`, async () => {
        const CMD = `frodo mapping import -f ${allMappingsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import --no-deps --file ${allMappingsFileName} --directory ${allDirectory}": should import the first mapping from the file "${allMappingsExport}"`, async () => {
        const CMD = `frodo mapping import --no-deps --file ${allMappingsFileName} --directory ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import -af ${allMappingsExport}": should import all mappings from the file "${allMappingsExport}"`, async () => {
        const CMD = `frodo mapping import -af ${allMappingsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import --all --no-deps --file ${allMappingsFileName} --directory ${allDirectory}": should import all mappings from the file "${allMappingsExport}"`, async () => {
        const CMD = `frodo mapping import --all --no-deps --file ${allMappingsFileName} --directory ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import -AD ${allSeparateMappingsDirectory}": should import all mappings from the ${allSeparateMappingsDirectory} directory"`, async () => {
        const CMD = `frodo mapping import -AD ${allSeparateMappingsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo mapping import --all-separate --no-deps --directory ${allSeparateMappingsDirectory}": should import all mappings from the ${allSeparateMappingsDirectory} directory"`, async () => {
        const CMD = `frodo mapping import --all-separate --no-deps --directory ${allSeparateMappingsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
