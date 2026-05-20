import { FrodoStubCommand } from '../FrodoCommand';
import RequestFormCmd from './request-forms/iga-request-forms';
import WorkflowCmd from './workflow/iga-workflow';

export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());
  program.addCommand(
    RequestFormCmd().name('request-form').showHelpAfterError()
  );

  program.showHelpAfterError();
  return program;
}
