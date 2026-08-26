import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-property-create';
import DeleteCmd from './idm-schema-property-delete';
import DescribeCmd from './idm-schema-property-describe';
import ListCmd from './idm-schema-property-list';
import UpdateCmd from './idm-schema-property-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema property');

  program.description('Manage individual managed-object schema properties.');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
