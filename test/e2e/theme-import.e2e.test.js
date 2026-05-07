import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaThemesFileName = "allAlphaThemes.theme.json";
const allAlphaThemesExport = `${allDirectory}/${allAlphaThemesFileName}`;
const allSeparateThemesDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/theme`;

describe('frodo theme import', () => {
    test(`"frodo theme import -n \'Starter Theme\' -f ${allAlphaThemesExport}": should import the theme with the name "Starter Theme" from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -n 'Starter Theme' -f ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import --theme-name \'Starter Theme\' --file ${allAlphaThemesExport}": should import the theme with the name "Starter Theme" from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import --theme-name 'Starter Theme' --file ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -n \'Starter Theme\' -f ${allAlphaThemesFileName} -D ${allDirectory}": should import the theme with the name "Starter Theme" from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -n 'Starter Theme' -f ${allAlphaThemesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -i 86ce2f64-586d-44fe-8593-b12a85aac68d -f ${allAlphaThemesExport}": should import the theme with the id "86ce2f64-586d-44fe-8593-b12a85aac68d" from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -i 86ce2f64-586d-44fe-8593-b12a85aac68d -f ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import --theme-id 86ce2f64-586d-44fe-8593-b12a85aac68d --file ${allAlphaThemesExport}": should import the theme with the id "86ce2f64-586d-44fe-8593-b12a85aac68d" from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import --theme-id 86ce2f64-586d-44fe-8593-b12a85aac68d --file ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -i 86ce2f64-586d-44fe-8593-b12a85aac68d -f ${allAlphaThemesFileName} -D ${allDirectory}": should import the theme with the id "86ce2f64-586d-44fe-8593-b12a85aac68d" from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -i 86ce2f64-586d-44fe-8593-b12a85aac68d -f ${allAlphaThemesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -f ${allAlphaThemesExport}": should import the first theme from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -f ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import --file ${allAlphaThemesExport}": should import the first theme from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import --file ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -f ${allAlphaThemesFileName} -D ${allDirectory}": should import the first theme from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -f ${allAlphaThemesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -af ${allAlphaThemesExport}": should import all themes from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -af ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import --all --file ${allAlphaThemesExport}": should import all themes from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import --all --file ${allAlphaThemesExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -af ${allAlphaThemesFileName} -D ${allDirectory}": should import all themes from the file "${allAlphaThemesExport}"`, async () => {
        const CMD = `frodo theme import -af ${allAlphaThemesFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import -AD ${allSeparateThemesDirectory}": should import all themes from the '${allSeparateThemesDirectory}' directory"`, async () => {
        const CMD = `frodo theme import -AD ${allSeparateThemesDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo theme import --all-separate --directory ${allSeparateThemesDirectory}": should import all themes from the '${allSeparateThemesDirectory}' directory"`, async () => {
        const CMD = `frodo theme import --all-separate --directory ${allSeparateThemesDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
