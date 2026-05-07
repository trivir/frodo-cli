import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaProvidersFileName = "allAlphaProviders.idp.json";
const allAlphaProvidersExport = `${allDirectory}/${allAlphaProvidersFileName}`;
const allSeparateProvidersDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/idp`;

describe('frodo idp import', () => {
    test(`"frodo idp import -i google -f ${allAlphaProvidersExport}": should import the idp with the id "google" from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import -i google -f ${allAlphaProvidersExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import --no-deps --idp-id google --file ${allAlphaProvidersExport}": should import the idp with the id "google" from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import --no-deps --idp-id google --file ${allAlphaProvidersExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import -i google -f ${allAlphaProvidersFileName} -D ${allDirectory}": should import the idp with the id "google" from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import -i google -f ${allAlphaProvidersFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import -f ${allAlphaProvidersExport}": should import the first idp from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import -f ${allAlphaProvidersExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import --no-deps --file ${allAlphaProvidersExport}": should import the first idp from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import --no-deps --file ${allAlphaProvidersExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import -f ${allAlphaProvidersFileName} -D ${allDirectory}": should import the first idp from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import -f ${allAlphaProvidersFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import -af ${allAlphaProvidersExport}": should import all idps from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import -af ${allAlphaProvidersExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import --all --no-deps --file ${allAlphaProvidersExport}": should import all idps from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import --all --no-deps --file ${allAlphaProvidersExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import -af ${allAlphaProvidersFileName} -D ${allDirectory}": should import all idps from the file "${allAlphaProvidersExport}"`, async () => {
        const CMD = `frodo idp import -af ${allAlphaProvidersFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import -AD ${allSeparateProvidersDirectory}": should import all idps from the ${allSeparateProvidersDirectory} directory"`, async () => {
        const CMD = `frodo idp import -AD ${allSeparateProvidersDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo idp import --all-separate --no-deps --directory ${allSeparateProvidersDirectory}": should import all idps from the ${allSeparateProvidersDirectory} directory"`, async () => {
        const CMD = `frodo idp import --all-separate --no-deps --directory ${allSeparateProvidersDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
