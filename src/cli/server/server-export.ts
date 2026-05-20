import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportServersToFile,
  exportServersToFiles,
  exportServerToFile,
} from '../../ops/classic/ServerOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLASSIC_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLASSIC_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo server export', [], deploymentTypes);

  program
    .description('Export servers.')
    .addOption(
      new Option(
        '-i, --server-id <server-id>',
        'Server id. If specified, only one server is exported and the options -u, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-u, --server-url <server-url>',
        'Server url. Can be a unique substring of the full url (if not unique, it will error out). If specified, only one server is exported and the options -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Export all servers to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all servers to separate files (*.server.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '-x, --no-extract',
        'Do not extract the server properties from the exported file to a separate file.'
      ).default(true, 'true')
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Does not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '-d, --default',
        'Export server(s) along with the default server properties.'
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
        if (
          !options.serverId &&
          !options.serverUrl &&
          !options.all &&
          !options.allSeparate
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);

        // export by id or url
        if (options.serverId || options.serverUrl) {
          verboseMessage(
            `Exporting server ${options.serverId || options.serverUrl}...`
          );
          const outcome = await exportServerToFile(
            options.serverId,
            options.serverUrl,
            options.file,
            options.extract,
            options.metadata,
            {
              includeDefault: options.default,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage(`Exporting all servers to a single file...`);
          const outcome = await exportServersToFile(
            options.file,
            false,
            options.metadata,
            {
              includeDefault: options.default,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all servers to separate files...');
          const outcome = await exportServersToFiles(
            options.extract,
            options.metadata,
            {
              includeDefault: options.default,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
