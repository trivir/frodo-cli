import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-policy-delete.js';
import DescribeCmd from './iga-policy-describe.js';
import ExportCmd from './iga-policy-export.js';
import ImportCmd from './iga-policy-import.js';
import ListCmd from './iga-policy-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga policy');

  program.description('Manage iga sod policies.');

  program.addCommand(DeleteCmd().name('delete').description('Delete policys.'));

  program.addCommand(ListCmd().name('list').description('List policies.'));

  program.addCommand(
    ExportCmd().name('export').description('Export policies.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import policies.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe policies.')
  );

  return program;
}
