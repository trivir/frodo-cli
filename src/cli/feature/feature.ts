import { FrodoStubCommand } from '../FrodoCommand';
import DescribeCmd from './feature-describe';
import InstallCmd from './feature-install';
import ListCmd from './feature-list';
import ValidateCmd from './feature-validate';

export default function setup() {
  const program = new FrodoStubCommand('feature');

  program.description(
    'Manage IDM tenant-configuration features (e.g. groups, aiagent, am/2fa/profiles).'
  );

  program.addCommand(ListCmd().name('list'));

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(ValidateCmd().name('validate'));

  program.addCommand(InstallCmd().name('install'));

  return program;
}
