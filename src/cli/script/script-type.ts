import { FrodoStubCommand } from '../FrodoCommand';
import DescribeCmd from './script-type-describe.js';
import ListCmd from './script-type-list.js';

export default function setup() {
  const program = new FrodoStubCommand('type').description(
    'Manage scripting contexts (script types).'
  );

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  return program;
}
