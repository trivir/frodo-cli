import { FrodoStubCommand } from '../FrodoCommand';
import ExportCmd from './config-manager-export';

export default function setup() {
  const program = new FrodoStubCommand('config-manager').description(
    'Manage cloud configuration using fr-config-manager.'
  );
  program.addOption;

  program.addCommand(ExportCmd().name('export'));

  return program;
}
