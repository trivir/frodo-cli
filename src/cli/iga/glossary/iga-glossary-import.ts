import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importFirstGlossaryFromFile,
  importGlossarySchemaFromFile,
  importGlossarySchemasFromFile,
  importGlossarySchemasFromFiles,
} from '../../../ops/cloud/iga/IgaGlossaryOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga glossary import',
    [],
    deploymentTypes
  );

  program
    .description('Import glossaries.')
    .addOption(
      new Option(
        '-i, --glossary-id <glossary-id>',
        'glossary id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all glossaries from single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all glossaries from separate files (*.glossary.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '-o, --internal',
        'Include internal glossary schema in import if true.'
      )
    )
    .action(
      // implement program logic inside action handler
      async (host, realm, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          realm,
          user,
          password,
          options,
          command
        );
        const isImportById = options.glossaryId && options.file;
        const isImportAll = options.all && options.file;
        const isImportAllSeparate = options.allSeparate && !options.file;
        const isImportFirst = !!options.file;
        if (
          !isImportById &&
          !isImportAll &&
          !isImportAllSeparate &&
          !isImportFirst
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
        if (!getTokensIsSuccessful) process.exit(1)
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }
        // import by id
        if (isImportById) {
          verboseMessage(`Importing glossary "${options.glossaryId}"...`);
          const outcome = await importGlossarySchemaFromFile(
            options.glossaryId,
            options.file,
            {
              includeInternal: options.internal
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all glossaries from a single file (${options.file})...`
          );
          const outcome = await importGlossarySchemasFromFile(options.file, {
            includeInternal: options.internal
          });
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all glossaries from separate files (*.glossary.json) in current directory...'
          );
          const outcome = await importGlossarySchemasFromFiles({
            includeInternal: options.internal
          });
          if (!outcome) process.exitCode = 1;
        }
        else if (isImportFirst) {
          verboseMessage(
            `Importing first glossary from file "${options.file}"...`
          );
          const outcome = await importFirstGlossaryFromFile(options.file, {
            includeInternal: options.internal
          });
          if (!outcome) process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
