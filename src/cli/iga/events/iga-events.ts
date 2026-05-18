import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-events-delete.js';
import DescribeCmd from './iga-events-describe.js';
import ExportCmd from './iga-events-export.js';
import ImportCmd from './iga-events-import.js';
import ListCmd from './iga-events-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga events');

  program.description('Manage events.');

  program.addCommand(
    DeleteCmd().name('delete').description('Delete events.')
  );

  program.addCommand(ListCmd().name('list').description('List events.'));

  program.addCommand(
    ExportCmd().name('export').description('Export events.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import events.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe event.')
  );

  return program;
}
