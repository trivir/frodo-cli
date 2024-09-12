import { setupProgram, runProgram } from "./program";

(async () => {
  const program = await setupProgram();
  process.exitCode = await runProgram(program);
})();