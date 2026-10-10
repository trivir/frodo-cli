import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-request-type-delete';
import DescribeCmd from './iga-request-type-describe';
import ExportCmd from './iga-request-type-export';
import ImportCmd from './iga-request-type-import';
import ListCmd from './iga-request-type-list';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga request-type');

  program.description('Manage request types.');

  program.addCommand(
    DeleteCmd().name('delete').description('Delete request-type.')
  );

  program.addCommand(ListCmd().name('list').description('List request-type.'));

  program.addCommand(
    ExportCmd().name('export').description('Export request-type.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import request-type.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe request-type.')
  );

  return program;
}
