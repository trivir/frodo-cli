import { getEnv, testExport } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

process.env['FRODO_MOCK'] = '1';
process.env['FRODO_CONNECTION_PROFILES_PATH'] =
    './test/e2e/env/Connections.json';
const env = getEnv(c);

describe('frodo config-manager pull scripts', () => {
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir0": should export all scripts from all realms in fr-config manager style.`, async () => {
        const dirName = 'configManagerExportScriptsDir0';
        const CMD = `frodo config-manager pull scripts -D ${dirName}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir1 -p OAuth2": should export all scripts from all realms that start with OAuth2 in fr-config manager style.`, async () => {
        const dirName = 'configManagerExportScriptsDir1';
        const prefix = 'OAuth2'
        const CMD = `frodo config-manager pull scripts -D ${dirName} -p ${prefix}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir2 -r bravo": should export all scripts from the bravo realm in fr-config manager style.`, async () => {
        const dirName = 'configManagerExportScriptsDir2';
        const realm = 'bravo';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r ${realm}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir3 -n 'Bravo OIDC Claims Script' -r bravo": should export only the script with the name: "Bravo OIDC Claims Script".`, async () => {
        const dirName = 'configManagerExportScriptsDir3';
        const scriptName = 'Bravo OIDC Claims Script';
        const realm = 'bravo';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -n '${scriptName}' -r ${realm}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir4 -r bravo -p OAuth2 --just-config --script-type OAUTH2_MAY_ACT --just-content --language GROOVY": should export just the script content in the bravo realm that start with OAuth2 that are of the type OAuth2 May Act and are in the programming language of groovy".`, async () => {
        const dirName = 'configManagerExportScriptsDir4';
        const realm = 'bravo';
        const prefix = 'OAuth2'
        const scriptType = 'OAUTH2_MAY_ACT';
        const language = 'GROOVY';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r ${realm} -p ${prefix} --just-config --script-type ${scriptType} --just-content --language ${language}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir5 --language GROOVY": should export all groovy scripts`, async () => {
        const language = 'GROOVY';
        const dirName = 'configManagerExportScriptsDir5';
        const CMD = `frodo config-manager pull scripts -D ${dirName} --language ${language}`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir7 -r bravo -p SAML2 --just-config": should export just-config with prefix SAML2 in bravo realm `, async () => {
        const dirName = 'configManagerExportScriptsDir7';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo -p SAML2 --just-config`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir8 -r bravo --just-content": should export just content in bravo realm `, async () => {
        const dirName = 'configManagerExportScriptsDir8';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo --just-content`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir9 -r bravo -p SAML2 --just-config --script-type SAML2_NAMEID_MAPPER": should export scripts with prefix: SAML2, just-config, script-type: SAML2_NAMEID_MAPPER in bravo realm`, async () => {
        const dirName = 'configManagerExportScriptsDir9';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo -p SAML2 --just-config --script-type SAML2_NAMEID_MAPPER`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir10 --just-config": should export just-config`, async () => {
        const dirName = 'configManagerExportScriptsDir10';
        const CMD = `frodo config-manager pull scripts -D ${dirName} --just-config`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir11 -r bravo --just-config": should export all groovy scripts`, async () => {
        const dirName = 'configManagerExportScriptsDir11';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo --just-config`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir12 -r bravo -p SAML2 --just-content": should export all groovy scripts`, async () => {
        const dirName = 'configManagerExportScriptsDir12';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo -p SAML2 --just-content`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir13 --just-config --just-content": should export all just config and just content`, async () => {
        const dirName = 'configManagerExportScriptsDir13';
        const CMD = `frodo config-manager pull scripts -D ${dirName} --just-config --just-content`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir14 --script-type LIBRARY": should export all scripts-type library`, async () => {
        const dirName = 'configManagerExportScriptsDir14';
        const CMD = `frodo config-manager pull scripts -D ${dirName} --script-type LIBRARY`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir15 -r bravo --script-type LIBRARY": should export scripts-type LIBRARY in bravo realm only`, async () => {
        const dirName = 'configManagerExportScriptsDir15';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo --script-type LIBRARY`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir16 -n 'Coin Flip'": should export script name: coin Flip`, async () => {
        const dirName = 'configManagerExportScriptsDir16';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -n 'Coin Flip'`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir17 -r bravo -p SAML2 --script-type SAML2_NAMEID_MAPPER": should export scripts with prefix SAML2 and script-type SAML2_NAMEID_MAPPER in bravo realm`, async () => {
        const dirName = 'configManagerExportScriptsDir17';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo -p SAML2 --script-type SAML2_NAMEID_MAPPER`;
        await testExport(CMD, env, undefined, undefined, dirName, false);

    });
    test(`"frodo config-manager pull scripts -D configManagerExportScriptsDir18 -r bravo -p SAML2" should export scripts with prefix SAML2 from bravo realm `, async () => {
        const dirName = 'configManagerExportScriptsDir18';
        const CMD = `frodo config-manager pull scripts -D ${dirName} -r bravo -p SAML2`;
        await testExport(CMD, env, undefined, undefined, dirName, false);
    });
});