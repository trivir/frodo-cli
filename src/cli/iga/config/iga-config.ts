import { FrodoStubCommand } from '../../FrodoCommand';
import DescribeCmd from './iga-config-describe';
import ExportCmd from './iga-config-export';
import ImportCmd from './iga-config-import';
import ListCmd from './iga-config-list';

export default function setup() {
  const program = new FrodoStubCommand('frodo iga config');

  program.description('Manage configs.');

  program.addCommand(ListCmd().name('list').description('List configs.'));

  program.addCommand(ExportCmd().name('export').description('Export configs.'));

  program.addCommand(ImportCmd().name('import').description('Import configs.'));

  program.addCommand(
    DescribeCmd().name('describe').description('Describe config.')
  );

  return program;
}
