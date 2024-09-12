import cp from 'child_process';
import { Writable } from 'stream';
import { setupProgram, runProgram } from "../src/program";

class CaptureOutput extends Writable {
  private buffer: string = '';
  
  _write(chunk: any, _encoding: string, callback: Function) {
    this.buffer += chunk.toString();
    callback();
  }

  getContents() {
    return this.buffer;
  }
}

export async function execTest(command: string, options?: cp.ExecOptions): Promise<{
  stdout: string,
  stderr: string,
}> {
  // Copy old values for process
  const oldArgv = [...process.argv];
  const oldEnv = { ...process.env };
  const oldStdout = process.stdout.write;
  const oldStderr = process.stderr.write;

  // Set new values for process
  const stdoutCapture = new CaptureOutput();
  const stderrCapture = new CaptureOutput(); 
  process.argv = command.split(' ');
  process.env = options && options.env ? options.env : {};
  process.stdout.write = stdoutCapture.write.bind(stdoutCapture);
  process.stderr.write = stdoutCapture.write.bind(stderrCapture);

  // Run the program
  const program = await setupProgram();
  const exitCode = await runProgram(program);
  
  // Reset process values back to old values
  process.argv = oldArgv;
  process.env = oldEnv;
  process.stdout.write = oldStdout;
  process.stderr.write = oldStderr;

  // Throw an error if exit code is not 0
  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}: ${command}`);
  }

  // Return output of program
  return {
    stdout: stdoutCapture.getContents(),
    stderr: stdoutCapture.getContents(),
  };
}