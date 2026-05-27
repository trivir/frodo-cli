import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-certification-delete.js';
import DescribeCmd from './iga-certification-describe.js';
import ExportCmd from './iga-certification-export.js';
import ImportCmd from './iga-certification-import.js';
import ListCmd from './iga-certification-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga certification');

  program.description('Manage certifications.');

  program.addCommand(
    DeleteCmd().name('delete').description('Delete certifications.')
  );

  program.addCommand(
    ListCmd().name('list').description('List certifications.')
  );

  program.addCommand(
    ExportCmd().name('export').description('Export certifications.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import certifications.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe certification.')
  );

  return program;
}
