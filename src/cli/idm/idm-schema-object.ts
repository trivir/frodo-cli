import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-object-create';
import DeleteCmd from './idm-schema-object-delete';
import ExportCmd from './idm-schema-object-export';
import ImportCmd from './idm-schema-object-import';
import PropertyCmd from './idm-schema-object-property';
import UpdateCmd from './idm-schema-object-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema object');

  program.description(
    'Manage IDM managed-object configuration (schema, notifications, etc.).'
  );

  program.addCommand(ExportCmd().name('export'));

  program.addCommand(ImportCmd().name('import'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  program.addCommand(PropertyCmd().name('property'));

  return program;
}
