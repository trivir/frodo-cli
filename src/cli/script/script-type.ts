import { FrodoStubCommand } from '../FrodoCommand';
import DescribeCmd from './script-type-describe.js';

export default function setup() {
  const program = new FrodoStubCommand('type').description(
    'Manage scripting contexts (script types).'
  );

  program.addCommand(DescribeCmd().name('describe'));

  return program;
}
