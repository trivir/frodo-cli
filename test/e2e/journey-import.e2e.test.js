import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaJourneysFileName = "allAlphaJourneys.journey.json";
const allAlphaJourneysExport = `${allDirectory}/${allAlphaJourneysFileName}`;
const allSeparateJourneysDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/journey`;

describe('frodo journey import', () => {
    test(`"frodo journey import -f ${allSeparateJourneysDirectory}/FrodoTest.journey.json": should import the journey in file "${allSeparateJourneysDirectory}/FrodoTest.journey.json"`, async () => {
        const CMD = `frodo journey import -f ${allSeparateJourneysDirectory}/FrodoTest.journey.json`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import --verbose -f ${allSeparateJourneysDirectory}/FrodoTest.journey.json": should import the journey in file "${allSeparateJourneysDirectory}/FrodoTest.journey.json"`, async () => {
        const CMD = `frodo journey import --verbose -f ${allSeparateJourneysDirectory}/FrodoTest.journey.json`;
        const { stdout, stderr } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
        expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
    });

    test.skip(`"frodo journey import -i j00 -f ${allAlphaJourneysExport} --re-uuid": should import the journey with the id "j00" from the file "${allAlphaJourneysExport}" with new uuids`, async () => {
        const CMD = `frodo journey import -i j00 -f ${allAlphaJourneysExport} --re-uuid`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import --journey-id j00 -f ${allAlphaJourneysExport} --no-deps": should import the journey with the id "j00" from the file "${allAlphaJourneysExport}" with no deps`, async () => {
        const CMD = `frodo journey import --journey-id j00 -f ${allAlphaJourneysExport} --no-deps`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import -i j00 -f ${allAlphaJourneysFileName} -D ${allDirectory}": should import the journey with the id "j00" from the file "${allAlphaJourneysExport}"`, async () => {
        const CMD = `frodo journey import -i j00 -f ${allAlphaJourneysFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import --file ${allAlphaJourneysExport}": should import the first journey from the file "${allAlphaJourneysExport}"`, async () => {
        const CMD = `frodo journey import --file ${allAlphaJourneysExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test.skip(`"frodo journey import -f ${allAlphaJourneysExport} --re-uuid": should import the first journey from the file "${allAlphaJourneysExport}" with new uuids`, async () => {
        const CMD = `frodo journey import -f ${allAlphaJourneysExport} --re-uuid`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import --file ${allAlphaJourneysExport} --no-deps": should import the first journey from the file"${allAlphaJourneysExport}" with no deps`, async () => {
        const CMD = `frodo journey import --file ${allAlphaJourneysExport} --no-deps`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import -f ${allAlphaJourneysFileName} -D ${allDirectory}": should import the first journey from the file "${allAlphaJourneysExport}"`, async () => {
        const CMD = `frodo journey import -f ${allAlphaJourneysFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import -af ${allAlphaJourneysExport}": should import all journeys from the file "${allAlphaJourneysExport}"`, async () => {
        const CMD = `frodo journey import -af ${allAlphaJourneysExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test.skip(`"frodo journey import -af ${allAlphaJourneysExport} --re-uuid": should import all journeys from the file "${allAlphaJourneysExport}" with new uuids`, async () => {
        const CMD = `frodo journey import -af ${allAlphaJourneysExport} --re-uuid`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import --all --file ${allAlphaJourneysExport} --no-deps": should import all journeys from the file"${allAlphaJourneysExport}" with no deps`, async () => {
        const CMD = `frodo journey import --all --file ${allAlphaJourneysExport} --no-deps`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import -af ${allAlphaJourneysFileName} -D ${allDirectory}": should import all journeys from the file "${allAlphaJourneysExport}"`, async () => {
        const CMD = `frodo journey import -af ${allAlphaJourneysFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import -AD ${allSeparateJourneysDirectory}": should import all journeys from the ${allSeparateJourneysDirectory} directory"`, async () => {
        const CMD = `frodo journey import -AD ${allSeparateJourneysDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test.skip(`"frodo journey import -AD ${allSeparateJourneysDirectory} --re-uuid": should import all journeys from the ${allSeparateJourneysDirectory} directory with new uuids`, async () => {
        const CMD = `frodo journey import -AD ${allSeparateJourneysDirectory} --re-uuid`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo journey import --all-separate --no-deps --directory ${allSeparateJourneysDirectory}": should import all journeys from the ${allSeparateJourneysDirectory} directory with no deps`, async () => {
        const CMD = `frodo journey import --all-separate --no-deps --directory ${allSeparateJourneysDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
