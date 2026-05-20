import { FrodoStubCommand } from '../FrodoCommand';
import ScopeCmd from './scope/iga-scope';
import WorkflowCmd from './workflow/iga-workflow';

export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());
  program.addCommand(ScopeCmd().name('scope').showHelpAfterError());

  program.showHelpAfterError();
  return program;
}
