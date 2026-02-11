import { FrodoStubCommand } from '../../FrodoCommand';
import Themes from './config-manager-push-themes';
import UiConfig from './config-manager-push-uiConfig';

export default function setup() {
  const program = new FrodoStubCommand('frodo config-manager pull').description(
    'Export cloud configuration using fr-config-manager.'
  );

  
  program.addCommand(Themes().name('themes'));
  program.addCommand(UiConfig().name('ui-config'));

  return program;
}


