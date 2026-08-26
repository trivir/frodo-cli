import { FrodoStubCommand } from '../FrodoCommand';
import Objects from './idm-schema-object';
import Properties from './idm-schema-property';
import Relationships from './idm-schema-relationship';

export default function setup() {
  const program = new FrodoStubCommand('frodo idm schema');

  program.description('Manage IDM schema.');

  program.addCommand(Objects().name('object'));

  program.addCommand(Properties().name('property'));

  program.addCommand(Relationships().name('relationship'));

  return program;
}
