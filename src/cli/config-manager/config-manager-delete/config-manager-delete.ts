import Test from '../../conn/conn-test';
import { FrodoStubCommand } from '../../FrodoCommand';
import Locales from '../config-manager-delete/config-manager-delete-locales';

export default function setup() {
  const program = new FrodoStubCommand('delete').description(
    'Delete configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(Test().name('test'));
  program.addCommand(Locales().name('locales'));
  return program;
}
