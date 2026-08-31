import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-property-create';
import DeleteCmd from './idm-schema-property-delete';
import DescribeCmd from './idm-schema-property-describe';
import ExportCmd from './idm-schema-property-export';
import ImportCmd from './idm-schema-property-import';
import ListCmd from './idm-schema-property-list';
import UpdateCmd from './idm-schema-property-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema property');

  program.description('Manage IDM managed object property schema definitions.');

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(ExportCmd().name('export'));

  program.addCommand(ImportCmd().name('import'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
