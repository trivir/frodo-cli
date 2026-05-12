import { FrodoStubCommand } from '../FrodoCommand';
import RequestTypeCmd from './request-types/iga-request-type';
import WorkflowCmd from './workflow/iga-workflow';

export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());
  program.addCommand(
    RequestTypeCmd().name('request-type').showHelpAfterError()
  );

  program.showHelpAfterError();
  return program;
}
