import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = "test/e2e/exports/all";
const allAlphaCirclesOfTrustFileName = "allAlphaCirclesOfTrust.cot.saml.json";
const allAlphaCirclesOfTrustExport = `${allDirectory}/${allAlphaCirclesOfTrustFileName}`;
const allSeparateCircleOfTrustsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/cot`;

describe('frodo saml cot import', () => {
    test(`"frodo saml cot import -i AzureCOT -f ${allAlphaCirclesOfTrustExport}": should import the saml circle of trust with the id "AzureCOT" from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import -i AzureCOT -f ${allAlphaCirclesOfTrustExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import --cot-id AzureCOT --file ${allAlphaCirclesOfTrustExport}": should import the saml circle of trust with the id "AzureCOT" from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import --cot-id AzureCOT --file ${allAlphaCirclesOfTrustExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import -i AzureCOT -f ${allAlphaCirclesOfTrustFileName} -D ${allDirectory}": should import the saml circle of trust with the id "AzureCOT" from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import -i AzureCOT -f ${allAlphaCirclesOfTrustFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import -f ${allAlphaCirclesOfTrustExport}": should import the first saml circle of trust from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import -f ${allAlphaCirclesOfTrustExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import --file ${allAlphaCirclesOfTrustExport}": should import the first saml cot from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import --file ${allAlphaCirclesOfTrustExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import -f ${allAlphaCirclesOfTrustFileName} -D ${allDirectory}": should import the first saml circle of trust from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import -f ${allAlphaCirclesOfTrustFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import -af ${allAlphaCirclesOfTrustExport}": should import all saml circle of trusts from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import -af ${allAlphaCirclesOfTrustExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import --all --file ${allAlphaCirclesOfTrustExport}": should import all saml circle of trusts from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import --all --file ${allAlphaCirclesOfTrustExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import -af ${allAlphaCirclesOfTrustFileName} -D ${allDirectory}": should import all saml circle of trusts from the file "${allAlphaCirclesOfTrustExport}"`, async () => {
        const CMD = `frodo saml cot import -af ${allAlphaCirclesOfTrustFileName} -D ${allDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import -AD ${allSeparateCircleOfTrustsDirectory}": should import all saml circle of trusts from the ${allSeparateCircleOfTrustsDirectory} directory"`, async () => {
        const CMD = `frodo saml cot import -AD ${allSeparateCircleOfTrustsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo saml cot import --all-separate --directory ${allSeparateCircleOfTrustsDirectory}": should import all saml circle of trusts from the ${allSeparateCircleOfTrustsDirectory} directory"`, async () => {
        const CMD = `frodo saml cot import --all-separate --directory ${allSeparateCircleOfTrustsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

});
