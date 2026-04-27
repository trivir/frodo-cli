/**
 * Follow this process to write e2e tests for the CLI project:
 *
 * 1. Test if all the necessary mocks for your tests already exist.
 *    In mock mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=1 frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    If your command completes without errors and with the expected results,
 *    all the required mocks already exist and you are good to write your
 *    test and skip to step #4.
 *
 *    If, however, your command fails and you see errors like the one below,
 *    you know you need to record the mock responses first:
 *
 *    [Polly] [adapter:node-http] Recording for the following request is not found and `recordIfMissing` is `false`.
 *
 * 2. Record mock responses for your exact command.
 *    In mock record mode, run the command you want to test with the same arguments
 *    and parameters exactly as you want to test it, for example:
 *
 *    $ FRODO_MOCK=record frodo conn save https://openam-frodo-dev.forgeblocks.com/am volker.scheuber@forgerock.com Sup3rS3cr3t!
 *
 *    Wait until you see all the Polly instances (mock recording adapters) have
 *    shutdown before you try to run step #1 again.
 *    Messages like these indicate mock recording adapters shutting down:
 *
 *    Polly instance 'conn/4' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 2s...
 *    Polly instance 'conn/save/3' stopping in 3s...
 *    Polly instance 'conn/4' stopping in 1s...
 *    Polly instance 'conn/save/3' stopping in 2s...
 *    Polly instance 'conn/4' stopped.
 *    Polly instance 'conn/save/3' stopping in 1s...
 *    Polly instance 'conn/save/3' stopped.
 *
 * 3. Validate your freshly recorded mock responses are complete and working.
 *    Re-run the exact command you want to test in mock mode (see step #1).
 *
 * 4. Write your test.
 *    Make sure to use the exact command including number of arguments and params.
 *
 * 5. Commit both your test and your new recordings to the repository.
 *    Your tests are likely going to reside outside the frodo-lib project but
 *    the recordings must be committed to the frodo-lib project.
 */

/*
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga workflow delete -di testWorkflow1
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga workflow delete -pi testWorkflow1
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga workflow delete --workflow-id testWorkflow4
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga workflow delete --draft-only -a
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga workflow delete --published-only -a
FRODO_MOCK=record FRODO_NO_CACHE=1 FRODO_HOST=https://openam-frodo-dev.forgeblocks.com/am frodo iga workflow delete -dp --all
 */

import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { iga_connection as ic } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const igaEnv = getEnv(ic);

describe(`frodo iga workflow delete`, () => {
  test(`"frodo iga workflow delete -di testWorkflow1": should delete draft testWorkflow1"`, async () => {
    const CMD = `frodo iga workflow delete -di testWorkflow1`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga workflow delete -pi testWorkflow1": should delete published testWorkflow1`, async () => {
    const CMD = `frodo iga workflow delete -pi testWorkflow1`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga workflow delete --workflow-id testWorkflow4": Should delete both draft and published testWorkflow4`, async () => {
    const CMD = `frodo iga workflow delete --workflow-id testWorkflow4`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga workflow delete --draft-only -a": should delete all draft workflows`, async () => {
    const CMD = `frodo iga workflow delete --draft-only -a`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga workflow delete --published-only -a": should delete all published workflows`, async () => {
    const CMD = `frodo iga workflow delete --published-only -a`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });

  test(`"frodo iga workflow delete -dp --all": should delete all workflows`, async () => {
    const CMD = `frodo iga workflow delete -dp --all`;
    const { stdout, stderr } = await exec(CMD, igaEnv);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
    expect(removeAnsiEscapeCodes(stderr)).toMatchSnapshot();
  });
});
