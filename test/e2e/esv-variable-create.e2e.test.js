import cp from 'child_process';
import { promisify } from 'util';
import { getEnv, removeAnsiEscapeCodes } from './utils/TestUtils';
import { connection as c } from './utils/TestConfig';

const exec = promisify(cp.exec);

process.env['FRODO_MOCK'] = '1';
const env = getEnv(c);

describe('frodo esv variable create', () => {
  test('"frodo esv variable create -i esv-test-var-pi --value "3.1415926" --description "This is another test variable." --variable-type number": should create an esv variable of type number with the value of pi.', async () => {
    const CMD = `frodo esv variable create -i esv-test-var-pi --value "3.1415926" --description "This is another test variable." --variable-type number`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test('"frodo esv variable create --variable-id esv-test-var-pi-string --value "3.1415926" --variable-type string --description "This is another test variable."": should create an esv variable of type string with the value of pi.', async () => {
    const CMD = `frodo esv variable create --variable-id esv-test-var-pi-string --value "3.1415926" --variable-type string --description "This is another test variable."`;
    const { stdout } = await exec(CMD, env);
    expect(removeAnsiEscapeCodes(stdout)).toMatchSnapshot();
  });

  test('"frodo esv variable create --variable-id esv-test-var-pi-unknown --value "3.1415926" --description "This is another test variable." --variable-type unknown": should display an error when trying to create an esv variable of unknown type', async () => {
    const CMD = `frodo esv variable create --variable-id esv-test-var-pi-unknown --value "3.1415926" --description "This is another test variable." --variable-type unknown`;
    try {
      await exec(CMD, env);
      fail("Command should've failed");
    } catch (e) {
      expect(removeAnsiEscapeCodes(e.stderr)).toMatchSnapshot();
    }
  });
});
