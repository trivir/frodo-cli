import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c, forgeops_connection as fc } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);
const forgeopsEnv = getEnv(fc);

const allDirectory = "test/e2e/exports/all";
const allAlphaApplicationsFileName = "allAlphaApplications.application.json";
const allAlphaApplicationsExport = `${allDirectory}/${allAlphaApplicationsFileName}`;
const allSeparateApplicationsDirectory = `test/e2e/exports/all-separate/cloud/realm/root-alpha/application`;
const forgeopsRootApplicationsExport = `${allDirectory}/forgeopsRootApps.application.json`;
const forgeopsAlphaApplicationsExport = `${allDirectory}/forgeopsAlphaApps.application.json`;
const forgeopsBravoApplicationsExport = `${allDirectory}/forgeopsBravoApps.application.json`;

describe('frodo app import', () => {

    test(`"frodo app import --no-deps -i e124e6f6-e25a-4180-a6c3-ff8b782a422c -f ${allAlphaApplicationsExport}": should import the application with the id "e124e6f6-e25a-4180-a6c3-ff8b782a422c" from the file "${allAlphaApplicationsExport}" with no dependencies`, async () => {
        const CMD = `frodo app import --no-deps -i e124e6f6-e25a-4180-a6c3-ff8b782a422c -f ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --app-id e124e6f6-e25a-4180-a6c3-ff8b782a422c --file ${allAlphaApplicationsExport}": should import the application with the id "e124e6f6-e25a-4180-a6c3-ff8b782a422c" from the file "${allAlphaApplicationsExport}"`, async () => {
        const CMD = `frodo app import --app-id e124e6f6-e25a-4180-a6c3-ff8b782a422c --file ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });


    test(`"frodo app import --no-deps -n testLDAP -f ${allAlphaApplicationsExport}": should import the application with the name "testLDAP" from the file "${allAlphaApplicationsExport}" with no dependencies`, async () => {
        const CMD = `frodo app import --no-deps -n testLDAP -f ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --app-name testLDAP --file ${allAlphaApplicationsExport}": should import the application with the name "testLDAP" from the file "${allAlphaApplicationsExport}"`, async () => {
        const CMD = `frodo app import --app-name testLDAP --file ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --no-deps -f ${allAlphaApplicationsExport}": should import the first application from the file "${allAlphaApplicationsExport}" with no dependencies`, async () => {
        const CMD = `frodo app import --no-deps -f ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --file ${allAlphaApplicationsExport}": should import the first application from the file "${allAlphaApplicationsExport}"`, async () => {
        const CMD = `frodo app import --file ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --no-deps -af ${allAlphaApplicationsExport}": should import all applications from the file "${allAlphaApplicationsExport}" with no dependencies`, async () => {
        const CMD = `frodo app import --no-deps -af ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --all --file ${allAlphaApplicationsExport}": should import all applications from the file "${allAlphaApplicationsExport}"`, async () => {
        const CMD = `frodo app import --all --file ${allAlphaApplicationsExport}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --no-deps -AD ${allSeparateApplicationsDirectory}": should import all applications from the directory "${allSeparateApplicationsDirectory}" with no dependencies`, async () => {
        const CMD = `frodo app import --no-deps -AD ${allSeparateApplicationsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --all-separate --directory ${allSeparateApplicationsDirectory}": should import all applications from the directory "${allSeparateApplicationsDirectory}"`, async () => {
        const CMD = `frodo app import --all-separate --directory ${allSeparateApplicationsDirectory}`;
        const { stdout } = await exec(CMD, env);
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import -af ${forgeopsRootApplicationsExport} -m forgeops": should import the 'application' apps into forgeops"`, async () => {
        const CMD = `frodo app import -af ${forgeopsRootApplicationsExport} -m forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_TEST_NAME: 'rootNoPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --all --file ${forgeopsRootApplicationsExport} --use-realm-prefix-on-managed-objects --type forgeops": should import the 'application' apps into forgeops"`, async () => {
        const CMD = `frodo app import --all --file ${forgeopsRootApplicationsExport} --use-realm-prefix-on-managed-objects --type forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_TEST_NAME: 'rootPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import -af ${forgeopsRootApplicationsExport} -m forgeops": should import the 'application' apps into forgeops"`, async () => {
        const CMD = `frodo app import -af ${forgeopsRootApplicationsExport} -m forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha',
                FRODO_TEST_NAME: 'alphaNoPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --all --file ${forgeopsAlphaApplicationsExport} --use-realm-prefix-on-managed-objects --type forgeops": should import the 'alpha_application' apps into forgeops"`, async () => {
        const CMD = `frodo app import --all --file ${forgeopsAlphaApplicationsExport} --use-realm-prefix-on-managed-objects --type forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha',
                FRODO_TEST_NAME: 'alphaPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import -af ${forgeopsRootApplicationsExport} -m forgeops": should import the 'application' apps into forgeops"`, async () => {
        const CMD = `frodo app import -af ${forgeopsRootApplicationsExport} -m forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha/bravo',
                FRODO_TEST_NAME: 'alphaBravoNoPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });

    test(`"frodo app import --all --file ${forgeopsBravoApplicationsExport} --use-realm-prefix-on-managed-objects --type forgeops": should import the 'bravo_application' apps into forgeops"`, async () => {
        const CMD = `frodo app import --all --file ${forgeopsBravoApplicationsExport} --use-realm-prefix-on-managed-objects --type forgeops`;
        const { stdout } = await exec(CMD, {
            env: {
                ...forgeopsEnv.env,
                FRODO_REALM: 'alpha/bravo',
                FRODO_TEST_NAME: 'alphaBravoPrefix',
            }
        });
        expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    });
});
