import { execTest } from "../../TestUtils";
import { autoSetupPolly } from "../../AutoSetupPolly";

const ctx = autoSetupPolly();
const CMD = 'frodo admin add-autoid-static-user-mapping --help';
const { stdout } = await execTest(CMD);

test("CLI help interface for 'admin add-autoid-static-user-mapping' should be expected english", async () => {
  expect(stdout).toMatchSnapshot();
});
