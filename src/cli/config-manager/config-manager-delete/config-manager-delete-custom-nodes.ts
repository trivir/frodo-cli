import { Option } from 'commander';
import { configManagerDeleteCustomNodes } from '../../../configManagerOps/FrConfigCustomNodesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo config-manager delete custom-nodes');
  program
    .description('Delete custom nodes.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Custom node display name. If name is not specified, all custom nodes are deleted.'
      )
    )
    .addOption(
      new Option(
        '-d, --dry-run',
        'Show which custom nodes would be deleted without deleting them.'
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
        `${options.dryRun ? 'Dry run: ' : ''}Deleting custom nodes${
          options.name ? ` with name ${options.name}` : ''
        }`
      );
      const outcome = await configManagerDeleteCustomNodes(
        options.name,
        options.dryRun
      );
      if (!outcome) process.exitCode = 1;
    });
  return program;
}
