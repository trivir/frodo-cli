import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-relationship-create';
import DeleteCmd from './idm-schema-relationship-delete';
import DescribeCmd from './idm-schema-relationship-describe';
import ListCmd from './idm-schema-relationship-list';
import UpdateCmd from './idm-schema-relationship-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema relationship');

  program.description('Manage IDM relationship schema definitions.');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
