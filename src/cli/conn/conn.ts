import { FrodoStubCommand } from '../FrodoCommand';
import AddCmd from './conn-add.js';
import DeleteCmd from './conn-delete.js';
import DescribeCmd from './conn-describe.js';
import ListCmd from './conn-list.js';

export default function setup() {
  const program = new FrodoStubCommand('conn')
    .alias('connection')
    // for backwards compatibility
    .alias('connections')
    .description('Manage connection profiles.');

  program.addCommand(AddCmd().name('add'));

  program.addCommand(DeleteCmd().name('delete'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(ListCmd().name('list'));

  return program;
}
