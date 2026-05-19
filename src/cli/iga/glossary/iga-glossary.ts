import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-glossary-delete.js';
import DescribeCmd from './iga-glossary-describe.js';
import ExportCmd from './iga-glossary-export.js';
import ImportCmd from './iga-glossary-import.js';
import ListCmd from './iga-glossary-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga glossary');

  program.description('Manage glossaries.');

  program.addCommand(
    DeleteCmd().name('delete').description('Delete glossaries.')
  );

  program.addCommand(
    ListCmd().name('list').description('List glossaries.')
  );

  program.addCommand(
    ExportCmd().name('export').description('Export glossaries.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import glossaries.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe glossary.')
  );

  return program;
}
