import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const idmExportDirectory = "test/e2e/exports/all-separate/cloud/global/idm";
const idmScriptConfigFileName = "script.idm.json";
const idmScriptConfigExport = `${idmExportDirectory}/${idmScriptConfigFileName}`;
const allIdmExportDirectory = 'test/e2e/exports/all';
const allIdmExportFileName = 'all.idm.json';
const allIdmExport = `${allIdmExportDirectory}/${allIdmExportFileName}`;
const testEntitiesFile = 'test/e2e/env/testEntitiesFile.json';
const testEnvFile = 'test/e2e/env/testEnvFile.env';

describe('frodo idm import', () => {
    test(`"frodo idm import -i script -D ${idmExportDirectory}": should import the idm config with name 'script' from the directory ${idmExportDirectory}"`, async () => {
        const CMD = `frodo idm import -i script -D ${idmExportDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idm import -f ${idmScriptConfigExport}": should import the idm config from the file named '${idmScriptConfigExport}'"`, async () => {
        const CMD = `frodo idm import -f ${idmScriptConfigExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idm import --entity-id script --file ${idmScriptConfigExport}": should import the idm config with name 'script' from the file named '${idmScriptConfigExport}'"`, async () => {
        const CMD = `frodo idm import --entity-id script --file ${idmScriptConfigExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idm import -i script -e ${testEnvFile} -f ${idmScriptConfigFileName} -D ${idmExportDirectory}": should import the idm config with name 'script' from the file named '${idmScriptConfigExport}'"`, async () => {
        const CMD = `frodo idm import -i script -e ${testEnvFile} -f ${idmScriptConfigFileName} -D ${idmExportDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idm import -af ${allIdmExport} -e ${testEnvFile} -E ${testEntitiesFile}": Should import all configs from the file '${allIdmExport}' according to the env and entity files"`, async () => {
        const CMD = `frodo idm import -af ${allIdmExport} -e ${testEnvFile} -E ${testEntitiesFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idm import --all --file ${allIdmExportFileName} -D ${allIdmExportDirectory}": Should import all configs from the file '${allIdmExportFileName}' in directory '${allIdmExportDirectory}'"`, async () => {
        const CMD = `frodo idm import --all --file ${allIdmExportFileName} -D ${allIdmExportDirectory}`;
        try {
            await exec(CMD, env);
            fail("Command should've failed");
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
        }
    });

    test(`"frodo idm import -AD ${idmExportDirectory}": Should import all configs from the directory '${idmExportDirectory}'"`, async () => {
        const CMD = `frodo idm import -AD ${idmExportDirectory}`;
        try {
            await exec(CMD, env);
            fail("Command should've failed");
        } catch (e) {
            expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
        }
    });

    test(`"frodo idm import --all-separate --directory ${idmExportDirectory} --env-file ${testEnvFile} --entities-file ${testEntitiesFile}": Should import all configs from the directory '${idmExportDirectory}' according to the env and entity files"`, async () => {
        const CMD = `frodo idm import --all-separate --directory ${idmExportDirectory} --env-file ${testEnvFile} --entities-file ${testEntitiesFile}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
