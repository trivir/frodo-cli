import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

const allDirectory = 'test/e2e/exports/all';
const allVariablesFileName = 'allVariables.variable.json';
const allVariablesExport = `${allDirectory}/${allVariablesFileName}`;
const allSeparateVariablesDirectory = `test/e2e/exports/all-separate/cloud/global/variable`;

describe('frodo esv variable import', () => {
  test(`"frodo esv variable import -i esv-test-var -f ${allVariablesExport}" Import variable "esv-test-var" from "${allVariablesExport}".`, async () => {
    const CMD = `frodo esv variable import -i esv-test-var -f ${allVariablesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import --variable-id esv-test-var --file ${allVariablesExport}" Import variable "esv-test-var" from "${allVariablesFileName}".`, async () => {
    const CMD = `frodo esv variable import --variable-id esv-test-var --file ${allVariablesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -i esv-test-var -f ${allVariablesFileName} -D ${allDirectory}" Import variable "esv-test-var" from "${allVariablesFileName}" in directory "${allDirectory}".`, async () => {
    const CMD = `frodo esv variable import -i esv-test-var -f ${allVariablesFileName} -D ${allDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -f ${allVariablesExport}" Import first variable from "${allVariablesExport}".`, async () => {
    const CMD = `frodo esv variable import -f ${allVariablesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -f ${allVariablesFileName} -D ${allDirectory}" Import first variable from "${allVariablesFileName}" in directory "${allDirectory}"`, async () => {
    const CMD = `frodo esv variable import -f ${allVariablesFileName} -D ${allDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -a --file ${allVariablesExport}" Import all variables from "${allVariablesExport}".`, async () => {
    const CMD = `frodo esv variable import -a --file ${allVariablesExport}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -a -f ${allVariablesFileName} -D ${allDirectory}" Import all variables from "${allVariablesFileName}" in directory "${allSeparateVariablesDirectory}".`, async () => {
    const CMD = `frodo esv variable import -a -f ${allVariablesFileName} -D ${allDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -AD ${allSeparateVariablesDirectory}" Import all variables in directory "${allSeparateVariablesDirectory}".`, async () => {
    const CMD = `frodo esv variable import -AD ${allSeparateVariablesDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test(`"frodo esv variable import -f esv-test-var.variable.json --directory ${allSeparateVariablesDirectory}" Import first variable from "esv-test-var.variable.json" in directory "${allSeparateVariablesDirectory}".`, async () => {
    const CMD = `frodo esv variable import -f esv-test-var.variable.json --directory ${allSeparateVariablesDirectory}`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });
});
