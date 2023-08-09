import { FrodoCommand } from '../FrodoCommand';
import { Option } from 'commander';
import { frodo } from '@rockcarver/frodo-lib';
import { verboseMessage } from '../../utils/Console.js';
import {
  exportWebAgentsToFile,
  exportWebAgentsToFiles,
  exportWebAgentToFile,
} from '../../ops/AgentOps.js';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo agent web export');

program
  .description('Export web agents.')
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
      'Export all web agents to a single file. Ignored with -i.'
    )
  )
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export all web agents to separate files (*.webagent.json) in the current directory. Ignored with -i or -a.'
    )
  )
  .addOption(
    new Option(
      '--no-metadata',
      'Does not include metadata in the export file.'
    )
  )
  .addOption(
    new Option(
      '--metadata-file [metadataFile]',
      'Name of the file to write the metadata to.'
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
          verboseMessage('Exporting web agent...');
          await exportWebAgentToFile(options.agentId, options.file, options.metadata, options.metadataFile);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all web agents to a single file...');
          await exportWebAgentsToFile(options.file, options.metadata, options.metadataFile);
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all web agents to separate files...');
          await exportWebAgentsToFiles(options.metadata, options.metadataFile);
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
