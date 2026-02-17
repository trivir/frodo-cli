import { FrodoStubCommand } from '../../FrodoCommand';
import TermsAndConditions from './config-manager-push-terms-and-conditions';
import Themes from './config-manager-push-themes';
import UiConfig from './config-manager-push-uiConfig';
import PasswordPolicy from './config-manager-push-password-policy'

export default function setup() {
  const program = new FrodoStubCommand('push').description(
    'Export cloud configuration using fr-config-manager.'
  );

  program.addCommand(Themes().name('themes'));
  program.addCommand(UiConfig().name('ui-config'));
  program.addCommand(TermsAndConditions().name('terms-and-conditions'));
  program.addCommand(PasswordPolicy().name('password-policy'))

  return program;
}
