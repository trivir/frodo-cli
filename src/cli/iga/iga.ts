import { FrodoStubCommand } from '../FrodoCommand';
import WorkflowCmd from './workflow/iga-workflow';
import CertificationCmd from './certification/iga-certification';


export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());

  program.addCommand(CertificationCmd().name('certification').showHelpAfterError());

  program.showHelpAfterError();
  return program;
}
