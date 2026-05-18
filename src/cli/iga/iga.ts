import { FrodoStubCommand } from '../FrodoCommand';
import WorkflowCmd from './workflow/iga-workflow';
import EventsCmd from './events/iga-events';

export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());
  program.addCommand(EventsCmd().name('events').showHelpAfterError());

  program.showHelpAfterError();
  return program;
}
