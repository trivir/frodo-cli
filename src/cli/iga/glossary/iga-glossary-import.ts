import { frodo, state } from '@rockcarver/frodo-lib';
import { GlossaryObjectType } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaGlossaryApi';
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

const glossaryTypeMap: Record<string, GlossaryObjectType> = {
  role: '/openidm/managed/role',
  entitlement: '/openidm/managed/assignment',
  application: '/openidm/managed/application',
  account: '/iga/governance/account',
};

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
        'glossary id. If specified, -n, -a, and -A cannot be used.'
      ).conflicts(['glossaryName', 'all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-n, --glossary-name <glossary-name>',
        'Specify a glossary name. If specified, -i, -a and -A cannot be used.'
      ).conflicts(['glossaryId', 'all', 'allSeparate'])
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all glossaries from single file. Cannot be used with -i, -n, or -A.'
      ).conflicts(['glossaryId', 'glossaryName', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all glossaries from separate files (*.glossary.json) in the current directory. Cannot be used with -i, -n, or -a.'
      ).conflicts(['glossaryId', 'glossaryName', 'all'])
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Do not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '-I, --internal',
        'Include internal glossary schema in import if true.'
      )
    )
    .addOption(
      new Option(
        '-t, --glossary-type <type>',
        'Filter glossary schema by type: role, entitlement, application, or account'
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
        const isImportByName = options.glossaryName && options.file;
        const isImportAll = options.all && options.file;
        const isImportAllSeparate = options.allSeparate && !options.file;
        const isImportFirst = !!options.file;
        if (
          !isImportById &&
          !isImportByName &&
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
        if (!getTokensIsSuccessful) process.exit(1);
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }

        const objectType = options.glossaryType
          ? glossaryTypeMap[options.glossaryType]
          : null;
        if (options.glossaryType && !objectType) {
          printMessage('Please provide a valid Object Type', 'error');
          process.exitCode = 1;
          program.help();
        }

        // import by id
        if (isImportById || isImportByName) {
          verboseMessage(
            `Importing glossary "${options.glossaryId ? options.glossaryId : options.glossaryName}"...`
          );
          const outcome = await importGlossarySchemaFromFile(
            options.glossaryId,
            options.glossaryName,
            objectType,
            options.file,
            {
              includeInternal: options.internal,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all glossaries from a single file (${options.file})...`
          );
          const outcome = await importGlossarySchemasFromFile(
            options.file,
            objectType,
            {
              includeInternal: options.internal,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all glossaries from separate files (*.glossary.json) in current directory...'
          );
          const outcome = await importGlossarySchemasFromFiles(objectType, {
            includeInternal: options.internal,
          });
          if (!outcome) process.exitCode = 1;
        } else if (isImportFirst) {
          verboseMessage(
            `Importing first glossary from file "${options.file}"...`
          );
          const outcome = await importFirstGlossaryFromFile(options.file, {
            includeInternal: options.internal,
          });
          if (!outcome) process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
