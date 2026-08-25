import { FrodoStubCommand } from '../FrodoCommand';
import DescribeCmd from './node-type-describe.js';
import ListCmd from './node-type-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo node type');

  program.description('Inspect node types (standard or custom).');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  return program;
}
