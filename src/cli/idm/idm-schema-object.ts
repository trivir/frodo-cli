import { FrodoStubCommand } from '../FrodoCommand';
import ExportCmd from './idm-schema-object-export';
import ImportCmd from './idm-schema-object-import';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema object');

  program.description(
    'Manage IDM managed-object configuration (schema, notifications, etc.).'
  );

  program.addCommand(ExportCmd().name('export'));

  program.addCommand(ImportCmd().name('import'));

  return program;
}
