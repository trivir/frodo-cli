import { Option } from 'commander';

import { configManagerDeleteScripts } from '../../../configManagerOps/FrConfigScriptOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand, ListOption } from '../../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo config-manager delete scripts');

  program
    .description('Delete AM scripts.')
    .addOption(
      new Option(
        '-n, --script-name <script name>',
        'Delete a specific script by name.'
      )
    )
    .addOption(
      new ListOption(
        '-p, --prefix <prefix>',
        'Delete all eligible scripts that start with a prefix. Repetition of this flag is allowed. Ignored with -n'
      )
    )
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      const getTokensIsSuccessful = await getTokens();
      if (!getTokensIsSuccessful) process.exit(1);

      verboseMessage(
        options.scriptName
          ? `Deleting script "${options.scriptName}".`
          : 'Deleting scripts'
      );
      const outcome = await configManagerDeleteScripts(
        options.prefix,
        realm,
        options.scriptName
      );

      if (!outcome) process.exitCode = 1;
    });

  return program;
}