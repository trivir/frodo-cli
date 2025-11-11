import { FrodoStubCommand } from '../FrodoCommand';
import DeleteCmd from './log-key-delete.js';
import DescribeCmd from './log-key-describe.js';
import ListCmd from './log-key-list.js';
import SaveCmd from './log-key-save';

export default function setup() {
  const program = new FrodoStubCommand('frodo log key');

  program.description('Manage Identity Cloud log API keys.');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(DeleteCmd().name('delete'));

  program.addCommand(SaveCmd().name('save'));

  return program;
}
