import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import fs from 'fs';
import path from 'path';
import yesno from 'yesno';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  getIdmImportDataFromIdmDirectory,
  getManagedObjectsFromFiles,
  getSchemaBearingObjectNames,
  importAllConfigEntitiesFromFiles,
  importConfigEntityByIdFromFile,
  importManagedObjectFromFile,
} from '../../ops/IdmOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

/**
 * Warns about any schema-bearing entries among the incoming managed-object
 * type objects and asks for confirmation before proceeding, unless the user
 * already passed -y/--yes. Returns false if the user declined, or if
 * confirmation would be required but stdin isn't an interactive terminal.
 */
async function confirmSchemaChanges(
  objects: { name: string; schema?: unknown }[],
  skipConfirmation: boolean
): Promise<boolean> {
  const names = getSchemaBearingObjectNames(objects);
  if (names.length === 0) {
    return true;
  }
  printMessage(
    '\nThis import defines the SCHEMA of the following managed-object type(s), not just their configuration:',
    'warn'
  );
  for (const name of names) {
    printMessage(`  - ${name}`, 'warn');
  }
  if (skipConfirmation) {
    return true;
  }
  if (!process.stdin.isTTY) {
    printMessage(
      '\nRefusing to prompt for confirmation without an interactive terminal. Pass -y/--yes to proceed with this schema change non-interactively.',
      'error'
    );
    return false;
  }
  return yesno({
    question:
      '\nSchema changes affect every existing and future record of that managed-object type. Continue? (y|n):',
  });
}

export default function setup() {
  const program = new FrodoCommand(
    'frodo idm schema object import',
    [],
    deploymentTypes
  );

  program
    .description(
      'Import IDM managed-object configuration (schema, notifications, etc.). Prompts for confirmation before importing schema changes, unless -y/--yes is passed.'
    )
    .addOption(new Option('-f, --file [file]', 'Import file.'))
    .addOption(
      new Option(
        '-i, --individual-object',
        'Import an individual object. Requires the use of the -f to specify the file.'
      )
    )
    .addOption(
      new Option(
        '-y, --yes',
        'Answer y/yes to the schema-change confirmation prompt.'
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
        const envMessage = options.envFile
          ? ` using ${options.envFile} for variable replacement`
          : '';
        const fileMessage = options.file ? ` from ${options.file}` : '';
        const directoryMessage = state.getDirectory()
          ? ` from separate files in ${state.getDirectory()}`
          : '';

        // require -D --directory or -f --file to import managed objects
        if (!state.getDirectory() && !options.file) {
          printMessage(
            '-D, --directory or -f, --file required to import managed objects',
            'error'
          );
          program.help();
          process.exitCode = 1;
        } // -i, --individual-object
        else if (
          options.individualObject &&
          options.file &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          const fileData = fs.readFileSync(
            path.resolve(process.cwd(), options.file),
            'utf8'
          );
          const object = JSON.parse(fileData);
          if (!(await confirmSchemaChanges([object], options.yes))) {
            printMessage('Import aborted.', 'warn');
            process.exitCode = 1;
            return;
          }
          verboseMessage(
            `Importing managed object ${envMessage}${fileMessage}...`
          );
          const outcome = await importManagedObjectFromFile(
            options.file,
            undefined
          );
          if (!outcome) process.exitCode = 1;
        } else if (
          options.file &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          const fileData = fs.readFileSync(
            path.resolve(process.cwd(), options.file),
            'utf8'
          );
          const managedData = getManagedObjectsFromFiles([
            {
              content: fileData,
              path: `${options.file.substring(0, options.file.lastIndexOf('/'))}/managed.idm.json`,
            },
          ]);
          if (!(await confirmSchemaChanges(managedData.objects, options.yes))) {
            printMessage('Import aborted.', 'warn');
            process.exitCode = 1;
            return;
          }
          verboseMessage(
            `Importing IDM configuration objects ${envMessage}${fileMessage}`
          );
          const outcome = await importConfigEntityByIdFromFile(
            'managed',
            options.file
          );
          if (!outcome) process.exitCode = 1;
        } else if (
          state.getDirectory() &&
          (await getTokens(false, true, deploymentTypes))
        ) {
          const importData = await getIdmImportDataFromIdmDirectory(
            state.getDirectory()
          );
          const managed = importData.idm?.managed as
            { objects?: { name: string; schema?: unknown }[] } | undefined;
          if (
            !(await confirmSchemaChanges(managed?.objects || [], options.yes))
          ) {
            printMessage('Import aborted.', 'warn');
            process.exitCode = 1;
            return;
          }
          verboseMessage(
            `Importing IDM configuration objects ${envMessage}${directoryMessage}`
          );
          const outcome = await importAllConfigEntitiesFromFiles(undefined);
          if (!outcome) process.exitCode = 1;
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
