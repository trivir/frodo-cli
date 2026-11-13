import { Option } from 'commander';
import { configManagerDeleteRemoteServers } from '../../../configManagerOps/FrConfigRemoteServersOps';
import * as s from '../../../help/SampleData';
import { getTokens } from '../../../ops/AuthenticateOps';
import {
  checkBulkDelete,
  confirmBulkDelete,
} from '../../../utils/BulkDeleteGuard';
import c from '../../../utils/ColorTheme';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager delete remote-servers'
  );

  program
    .description(
      'Delete remote connector servers by name or delete all of them.'
    )
    .addOption(
      new Option(
        '-n, --name <name>',
        'Delete the remote server with this exact name. If omitted, target all remote servers.'
      )
    )
    .addOption(
      new Option('-d, --dry-run', 'Show which remote servers would be deleted.')
    )
    .addOption(
      new Option(
        '-y, --yes',
        'Skip confirmation for bulk deletion. Required for bulk deletion without a terminal.'
      )
    )
    .addHelpText(
      'after',
      `Usage Examples:\n` +
        `  Preview deletion of all remote servers:\n` +
        c.command(
          `  $ frodo config-manager delete remote-servers -d ${s.connId}\n`
        ) +
        `  Delete a remote server by name:\n` +
        c.command(
          `  $ frodo config-manager delete remote-servers -n rcs ${s.connId}\n`
        ) +
        `  Delete all remote servers without prompting:\n` +
        c.command(
          `  $ frodo config-manager delete remote-servers -y ${s.connId}\n`
        )
    )
    .multiOp()
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );
      const bulk = options.name === undefined;
      const what = 'all remote servers';
      if (
        bulk &&
        !checkBulkDelete({ what, yes: options.yes, dryRun: options.dryRun })
      ) {
        process.exitCode = 1;
        return;
      }
      if (!(await getTokens(false, true))) {
        process.exitCode = 1;
        return;
      }
      if (
        bulk &&
        !(await confirmBulkDelete({
          what,
          yes: options.yes,
          dryRun: options.dryRun,
          showPlan: () => configManagerDeleteRemoteServers(undefined, true),
        }))
      ) {
        process.exitCode = 1;
        return;
      }
      verboseMessage('Deleting remote servers.');
      const outcome = await configManagerDeleteRemoteServers(
        options.name,
        options.dryRun,
        options.allowFailures
      );

      if (!outcome) process.exitCode = 1;
    });

  return program;
}
