import { FrodoStubCommand } from '../../FrodoCommand';
import ExportCmd from './iga-request-form.export';
import ImportCmd from './iga-request-form-import';
import DeleteCmd from './iga-request-forms-delete';
import DescribeCmd from './iga-request-forms-describe';
import ListCmd from './iga-request-forms-list';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga request-form');

  program.description('Manage request forms.');

  program.addCommand(
    DeleteCmd().name('delete').description('Delete request forms.')
  );

  program.addCommand(ListCmd().name('list').description('List request forms.'));

  program.addCommand(
    ExportCmd().name('export').description('Export request forms.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import request forms.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe request forms.')
  );

  return program;
}
