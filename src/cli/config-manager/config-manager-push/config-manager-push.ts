import { FrodoStubCommand } from '../../FrodoCommand';
import Kba from './config-manager-push-kba';

export default function setup() {
  const program = new FrodoStubCommand('frodo config-manager push').description(
    'Export cloud configuration using fr-config-manager.'
  );
  program.addCommand(Kba().name('kba'));
  return program;
}
