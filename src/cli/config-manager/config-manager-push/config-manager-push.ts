import { FrodoStubCommand } from '../../FrodoCommand';
import EmailProvider from './config-manager-push-email-provider';

export default function setup() {
  const program = new FrodoStubCommand('frodo config-manager push').description(
    'Import cloud configuration using fr-config-manager.'
  );

  program.addCommand(EmailProvider().name('email-provider'));
  return program;
}
