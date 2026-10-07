import Test from '../../conn/conn-test';
import { FrodoStubCommand } from '../../FrodoCommand';
import SecretMappings from './config-manager-delete-secret-mappings';

export default function setup() {
  const program = new FrodoStubCommand('delete').description(
    'Delete configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(Test().name('test'));
  program.addCommand(SecretMappings().name('secret-mappings'));
  return program;
}
