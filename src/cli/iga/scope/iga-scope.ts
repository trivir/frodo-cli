import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-scope-delete.js';
import DescribeCmd from './iga-scope-describe.js';
import ExportCmd from './iga-scope-export.js';
import ImportCmd from './iga-scope-import.js';
import ListCmd from './iga-scope-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga scope');

  program.description('Manage scopes.');

  program.addCommand(DeleteCmd().name('delete').description('Delete scopes.'));

  program.addCommand(ListCmd().name('list').description('List scopes.'));

  program.addCommand(ExportCmd().name('export').description('Export scopes.'));

  program.addCommand(ImportCmd().name('import').description('Import scopes.'));

  program.addCommand(
    DescribeCmd().name('describe').description('Describe scope.')
  );

  return program;
}
