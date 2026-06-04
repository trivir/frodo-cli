import { FrodoStubCommand } from '../FrodoCommand';
import SodPolicyCmd from './sod-policy/iga-policy';
import SodPolicyRulesCmd from './sod-policy-rule/iga-policy';
import WorkflowCmd from './workflow/iga-workflow';

export default function setup() {
  const program = new FrodoStubCommand('iga').description(
    'Manage IGA configuration.'
  );

  program.addCommand(WorkflowCmd().name('workflow').showHelpAfterError());
  program.addCommand(SodPolicyCmd().name('policy').showHelpAfterError());
  program.addCommand(SodPolicyRulesCmd().name('policy-rule'));

  program.showHelpAfterError();
  return program;
}
