import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  exportAgentsToFile,
  exportAgentsToFiles,
  exportAgentToFile,
} from '../../ops/AgentOps.js';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo agent export');

program
  .description('Export agents.')
  .addOption(
    new Option(
      '-i, --agent-id <agent-id>',
      'Agent id. If specified, -a and -A are ignored.'
    )
  )
  .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
  .addOption(
    new Option(
      '-a, --all',
      'Export all agents to a single file. Ignored with -i.'
    )
  )
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export all agents to separate files (*.<type>.agent.json) in the current directory. Ignored with -i or -a.'
    )
  )
  .addOption(
    new Option(
      '-j, --no-metadata',
      'Does not include metadata in the export file.'
    )
  )
  .addOption(
    new Option(
      '-S, --sort',
      'Sorts exported .json file(s) in abc order by key.'
    )
  )
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
        // export
        if (options.agentId) {
          verboseMessage('Exporting agent...');
          await exportAgentToFile(
            options.agentId,
            options.file,
            options.metadata,
            options.sort,
          );
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all agents to a single file...');
          await exportAgentsToFile(
            options.file,
            options.metadata,
            options.sort,
          );
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all agents to separate files...');
          await exportAgentsToFiles(
            options.metadata,
            options.sort,
          );
        }
        // unrecognized combination of options or no options
        else {
          verboseMessage(
            'Unrecognized combination of options or no options...'
          );
          program.help();
          process.exitCode = 1;
        }
      }
    }
    // end command logic inside action handler
  );

program.parse();
