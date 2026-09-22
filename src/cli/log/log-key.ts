import { FrodoStubCommand } from '../FrodoCommand';
import AddCmd from './log-key-add.js';
import DeleteCmd from './log-key-delete.js';
import DescribeCmd from './log-key-describe.js';
import ListCmd from './log-key-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo log key');

  program.description('Manage Identity Cloud log API keys.');

  program.addCommand(AddCmd().name('add'));

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
