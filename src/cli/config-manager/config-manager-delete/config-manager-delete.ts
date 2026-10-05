import Test from '../../conn/conn-test';
import { FrodoStubCommand } from '../../FrodoCommand';
import ConnectorDefininitions from '../config-manager-delete/config-manager-delete-connector-definitions';

export default function setup() {
  const program = new FrodoStubCommand('delete').description(
    'Delete configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(Test().name('test'));
  program.addCommand(ConnectorDefininitions().name('connector-definitions'));
  return program;
}
