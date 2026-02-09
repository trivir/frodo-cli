import UiConfig from './config-manager-push-uiConfig';
import { FrodoStubCommand } from '../../FrodoCommand';

export default function setup() {
  const program = new FrodoStubCommand('frodo config-manager push').description(
    'Export cloud configuration using fr-config-manager.'
  );

  program.addCommand(UiConfig().name('ui-config'));
  return program;
}