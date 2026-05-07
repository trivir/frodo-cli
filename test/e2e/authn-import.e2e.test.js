import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c, classic_connection as cc } from './utils/TestConfig';
import { promisify } from "util";
import cp from "child_process";

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);
const classicEnv = getEnv(cc);

const authnSettingsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/authentication`;
const globalAuthnSettingsDirectory = `test/e2e/exports/all-separate/classic/global/authentication`;
const realmAuthnSettingsName = 'root-alpha.authentication.settings.json'
const globalAuthnSettingsName = 'global.authentication.settings.json'

describe('frodo authn import', () => {
    test(`"frodo authn import -f ${authnSettingsDirectory}/${realmAuthnSettingsName}": should import authentication settings from the file ${realmAuthnSettingsName}`, async () => {
        const CMD = `frodo authn import -f ${authnSettingsDirectory}/${realmAuthnSettingsName}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authn import --file ${realmAuthnSettingsName} --directory ${authnSettingsDirectory}": should import authentication settings from the file ${realmAuthnSettingsName} in the directory ${authnSettingsDirectory}`, async () => {
        const CMD = `frodo authn import --file ${realmAuthnSettingsName} --directory ${authnSettingsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authn import -gf ${globalAuthnSettingsName} -D ${globalAuthnSettingsDirectory} -m classic": should import global authentication settings from the file ${globalAuthnSettingsName} in the directory ${globalAuthnSettingsDirectory}`, async () => {
        const CMD = `frodo authn import -gf ${globalAuthnSettingsName} -D ${globalAuthnSettingsDirectory} -m classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo authn import --global --file ${globalAuthnSettingsDirectory}/${globalAuthnSettingsName} --type classic": should import global authentication settings from the file ${globalAuthnSettingsName}`, async () => {
        const CMD = `frodo authn import --global --file ${globalAuthnSettingsDirectory}/${globalAuthnSettingsName} --type classic`;
        const { stdout } = await exec(CMD, classicEnv);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
