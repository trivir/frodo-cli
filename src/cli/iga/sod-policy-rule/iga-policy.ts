import { FrodoStubCommand } from '../../FrodoCommand';
import DeleteCmd from './iga-policy-rule-delete.js';
import DescribeCmd from './iga-policy-rule-describe.js';
import ExportCmd from './iga-policy-rule-export.js';
import ImportCmd from './iga-policy-rule-import.js';
import ListCmd from './iga-policy-rule-list.js';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga policy');

  program.description('Manage iga sod policy rules.');

  program.addCommand(
    DeleteCmd().name('delete').description('Delete policy rules.')
  );

  program.addCommand(ListCmd().name('list').description('List policy rules.'));

  program.addCommand(
    ExportCmd().name('export').description('Export policy rules.')
  );

  program.addCommand(
    ImportCmd().name('import').description('Import policy rules.')
  );

  program.addCommand(
    DescribeCmd().name('describe').description('Describe policy rules.')
  );

  return program;
}
