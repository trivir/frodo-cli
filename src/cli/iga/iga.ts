import { FrodoStubCommand } from '../FrodoCommand';
import GlossaryCmd from './glossary/iga-glossary';
import WorkflowCmd from './workflow/iga-workflow';

export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());

  program.addCommand(GlossaryCmd().name('glossary').showHelpAfterError());

  program.showHelpAfterError();
  return program;
}
