import { FrodoStubCommand } from '../../FrodoCommand';
import Themes from './config-manager-push-themes';


export default function setup() {
  const program = new FrodoStubCommand('push').description(
    'Export cloud configuration using fr-config-manager.'
  );

  program.addCommand(Themes().name('themes'));


  return program;
}
