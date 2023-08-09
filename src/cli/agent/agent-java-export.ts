import { FrodoCommand } from '../FrodoCommand';
import { Option } from 'commander';
import { frodo } from '@rockcarver/frodo-lib';
import { verboseMessage } from '../../utils/Console.js';
import {
  exportJavaAgentsToFile,
  exportJavaAgentsToFiles,
  exportJavaAgentToFile,
} from '../../ops/AgentOps.js';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo agent java export');

program
  .description('Export java agents.')
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
      'Export all java agents to a single file. Ignored with -i.'
    )
  )
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export all java agents to separate files (*.javaagent.json) in the current directory. Ignored with -i or -a.'
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
          verboseMessage('Exporting java agent...');
          await exportJavaAgentToFile(options.agentId, options.file, options.metadata, options.metadataFile);
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all java agents to a single file...');
          await exportJavaAgentsToFile(options.file, options.metadata, options.metadataFile);
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all java agents to separate files...');
          await exportJavaAgentsToFiles(options.metadata, options.metadataFile);
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
