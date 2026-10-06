import Test from '../../conn/conn-test';
import { FrodoStubCommand } from '../../FrodoCommand';
import EmailTemplates from '../config-manager-delete/config-manager-delete-email-templates';

export default function setup() {
  const program = new FrodoStubCommand('delete').description(
    'Delete configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(Test().name('test'));
  program.addCommand(EmailTemplates().name('email-templates'));
  return program;
}
