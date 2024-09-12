import { state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportAllConfigEntitiesToFile,
  exportAllConfigEntitiesToFiles,
  exportConfigEntity,
  warnAboutOfflineConnectorServers,
} from '../../ops/IdmOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand('frodo idm export', [], deploymentTypes);

  program
    .description('Export IDM configuration objects.')
    .addOption(
      new Option(
        '-N, --name <name>',
        'Config entity name. E.g. "managed", "sync", "provisioner-<connector-name>", etc.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Export file (or directory name if exporting mappings separately). Ignored with -A.'
      )
    )
    .addOption(
      new Option(
        '-E, --entities-file [entities-file]',
        'Name of the entity file. Ignored with -N.'
      )
    )
    .addOption(
      new Option(
        '-e, --env-file [envfile]',
        'Name of the env file. Ignored with -N.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all IDM configuration objects into a single file in directory -D. Ignored with -N.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all IDM configuration objects into separate JSON files in directory -D. Ignored with -N, and -a.'
      )
    )
    .addOption(
      new Option(
        '-s, --separate-mappings',
        'Export sync.json mappings separately in their own directory. Ignored with -a.'
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
        const entitiesMessage = options.entitiesFile
          ? ` specified in ${options.entitiesFile}`
          : '';
        const envMessage = options.envFile
          ? ` using ${options.envFile} for variable replacement`
          : '';
        const fileMessage = options.file ? ` into ${options.file}` : '';
        const directoryMessage = state.getDirectory()
          ? ` into separate files in ${state.getDirectory()}`
          : '';
        // export by id/name
        if (options.name && (await getTokens(false, true, deploymentTypes))) {
          verboseMessage(`Exporting object "${options.name}"...`);
          const outcome = await exportConfigEntity(
            options.name,
            options.file,
            options.separateMappings
          );
          if (!outcome) process.exitCode = 1;
          // --all -a
        } else if (
          options.all &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(
            `Exporting IDM configuration objects${entitiesMessage}${envMessage}${fileMessage}...`
          );
          const outcome = await exportAllConfigEntitiesToFile(
            options.file,
            options.entitiesFile,
            options.envFile
          );
          if (!outcome) process.exitCode = 1;
          await warnAboutOfflineConnectorServers();
        }
        // require --directory -D for all-separate functions
        else if (options.allSeparate && !state.getDirectory()) {
          printMessage(
            '-D or --directory required when using -A or --all-separate',
            'error'
          );
          program.help();
          process.exitCode = 1;
        }
        // --all-separate -A
        else if (
          options.allSeparate &&
          options.entitiesFile &&
          options.envFile &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(
            `Exporting IDM configuration objects${entitiesMessage}${envMessage}${directoryMessage}...`
          );
          const outcome = await exportAllConfigEntitiesToFiles(
            options.entitiesFile,
            options.envFile,
            options.separateMappings
          );
          if (!outcome) process.exitCode = 1;
          await warnAboutOfflineConnectorServers();
        }
        // --all-separate -A without variable replacement
        else if (
          options.allSeparate &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          verboseMessage(
            `Exporting IDM configuration objects${directoryMessage}...`
          );
          const outcome = await exportAllConfigEntitiesToFiles(
            undefined,
            undefined,
            options.separateMappings
          );
          if (!outcome) process.exitCode = 1;
          await warnAboutOfflineConnectorServers();
        }
        // unrecognized combination of options or no options
        else {
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
