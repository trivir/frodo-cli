import { FrodoStubCommand } from '../FrodoCommand';
import CreateCmd from './idm-schema-relationship-create';
import DeleteCmd from './idm-schema-relationship-delete';
import DescribeCmd from './idm-schema-relationship-describe';
import UpdateCmd from './idm-schema-relationship-update';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema relationship');

  program.description(
    'Manage relationship managed-object schema properties directly via the dedicated Cloud-only v2 schema API, including bidirectional (two-type) relationships. Cloud only -- use "idm schema property" for relationship properties on other deployments.'
  );

  program.addCommand(DescribeCmd().name('describe'));

  program.addCommand(CreateCmd().name('create'));

  program.addCommand(UpdateCmd().name('update'));

  program.addCommand(DeleteCmd().name('delete'));

  return program;
}
