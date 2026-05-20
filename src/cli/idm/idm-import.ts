import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  importAllConfigEntitiesFromFile,
  importAllConfigEntitiesFromFiles,
  importConfigEntityByIdFromFile,
  importFirstConfigEntityFromFile,
} from '../../ops/IdmOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand('frodo idm import', [], deploymentTypes);

  interface IdmImportOptions {
    type?: string;
    insecure?: boolean;
    verbose?: boolean;
    debug?: boolean;
    curlirize?: boolean;
    entityId?: string;
    file?: string;
    entitiesFile?: string;
    envFile?: string;
    all?: string;
    allSeparate?: string;
    directory?: string;
  }

  program
    .description('Import IDM configuration objects.')
    .addOption(
      new Option(
        '-i, --entity-id <id>',
        'Config entity id/name. E.g. "managed", "sync", "provisioner-<connector-name>", etc. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file [file]', 'Import file. Ignored with -A.'))
    .addOption(
      new Option(
        '-E, --entities-file [entities-file]',
        'Name of the entity file. Ignored with -i.'
      )
    )
    .addOption(new Option('-e, --env-file [envfile]', 'Name of the env file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all IDM configuration objects from a single file in directory -D. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all IDM configuration objects from separate files in directory -D. Ignored with -i, and -a.'
      )
    )
    .action(
      // implement command logic inside action handler
      async (
        host: string,
        realm: string,
        user: string,
        password: string,
        options: IdmImportOptions,
        command
      ) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );
        if (
          !options.entityId &&
          !options.file &&
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

        const entitiesMessage = options.entitiesFile
          ? ` specified in ${options.entitiesFile}`
          : '';
        const envMessage = options.envFile
          ? ` using ${options.envFile} for variable replacement`
          : '';
        const fileMessage = options.file ? ` from ${options.file}` : '';
        const directoryMessage = state.getDirectory()
          ? ` from separate files in ${state.getDirectory()}`
          : '';
        // import by id/name
        if (options.entityId) {
          verboseMessage(
            `Importing object "${options.entityId}"${envMessage}${fileMessage}...`
          );
          const outcome = await importConfigEntityByIdFromFile(
            options.entityId,
            options.file,
            options.envFile
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all && options.file) {
          verboseMessage(
            `Importing IDM configuration objects${entitiesMessage}${envMessage}${fileMessage}`
          );
          const outcome = await importAllConfigEntitiesFromFile(
            options.file,
            options.entitiesFile,
            options.envFile
          );
          if (!outcome) process.exitCode = 1;
        }
        // import from file
        else if (options.file) {
          verboseMessage(
            `Importing first object${envMessage}${fileMessage}...`
          );
          const outcome = await importFirstConfigEntityFromFile(
            options.file,
            options.envFile
          );
          if (!outcome) process.exitCode = 1;
        }
        // require --directory -D for all-separate functions
        else if (options.allSeparate && !state.getDirectory()) {
          printMessage(
            '-D or --directory required when using -A or --all-separate',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage(
            `Importing IDM configuration objects${entitiesMessage}${envMessage}${directoryMessage}`
          );
          const outcome = await importAllConfigEntitiesFromFiles(
            options.entitiesFile,
            options.envFile
          );
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
