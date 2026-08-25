import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-object-property-create';
import DeleteCmd from './idm-schema-object-property-delete';
import DescribeCmd from './idm-schema-object-property-describe';
import ListCmd from './idm-schema-object-property-list';
import UpdateCmd from './idm-schema-object-property-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema object property');

  program.description('Manage individual managed-object schema properties.');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
