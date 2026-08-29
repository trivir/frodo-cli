import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-relationship-create';
import DeleteCmd from './idm-schema-relationship-delete';
import DescribeCmd from './idm-schema-relationship-describe';
import ExportCmd from './idm-schema-relationship-export';
import ImportCmd from './idm-schema-relationship-import';
import ListCmd from './idm-schema-relationship-list';
import UpdateCmd from './idm-schema-relationship-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema relationship');

  program.description('Manage IDM relationship schema definitions.');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(ExportCmd().name('export'));

  program.addCommand(ImportCmd().name('import'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
