import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { describeScriptBindings } from '../../ops/ScriptOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo script type describe');

  program
    .description(
      'Describe the bindings (available objects/APIs, e.g. httpClient, idRepository) exposed to scripts running in a given scripting context.'
    )
    .addOption(
      new Option(
        '-c, --context <context>',
        'Scripting context id. E.g. "SCRIPTED_DECISION_NODE".'
      ).makeOptionMandatory()
    )
    .addOption(new Option('--json', 'Output in JSON format.'))
    .action(
      // implement command logic inside action handler
      async (host, realm, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );
        if (await getTokens()) {
          verboseMessage(
            `Describing script bindings for context ${options.context}...`
          );
          const outcome = await describeScriptBindings(
            options.context,
            options.json
          );
          if (!outcome) process.exitCode = 1;
        } else {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          program.help();
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
