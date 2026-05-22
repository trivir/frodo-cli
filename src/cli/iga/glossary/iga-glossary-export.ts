import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportGlossarySchemasToFile,
  exportGlossarySchemasToFiles,
  exportGlossarySchemaToFile,
} from '../../../ops/cloud/iga/IgaGlossaryOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';
import { GlossaryObjectType } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaGlossaryApi';

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
    'frodo iga glossary export',
    [],
    deploymentTypes
  );
  
  program
    .description('Export glossaries.')
    .addOption(
      new Option(
        '-i, --glossary-id <glossary-id>',
        'Specify a glossary id. If specified, -n, -a and -A cannot be used.'
      ).conflicts(['glossaryName', 'all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-n, --glossary-name <glossary-name>',
        'Specify a glossary name. If specified, -i, -a and -A cannot be used.'
      ).conflicts(['glossaryId', 'all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Cannot be used with -A. Defaults to <glossary-id>.glossary.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all glossaries to a single file. Cannot be used with -i, -n or -A.'
      ).conflicts(['glossaryId', 'glossaryName', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all glossaries as separate files <glossary-id>.glossary.json. Cannot be used with -i, -n, -f and -a.'
      ).conflicts(['glossaryId', 'glossaryName', 'all', 'file'])
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Do not include metadata in the export file.'
      )
    )
    .addOption(
      new Option(
        '-M, --modified-properties',
        'Include modified properties in export (e.g. lastModifiedDate, lastModifiedBy, createdBy, creationDate, etc.)'
      ).default(false, 'false')
    )
    .addOption(
      new Option(
        '-I, --internal',
        'Include internal glossary schemas in export if true. Cannot be used with -i or -n.'
      ).default(false, 'false').conflicts(['glossaryId', 'glossaryName'])
    )
    .addOption(
      new Option(
        '-t, --glossary-type <type>',
        'Filter glossary schema by type: role, entitlement, application, or account'
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
        
        if (!options.glossaryId && !options.glossaryName && !options.all && !options.allSeparate) {
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
        
        // --glossary-id -i || --glossary-name -n
        if (options.glossaryId || options.glossaryName) {
          verboseMessage(`Exporting glossary "${options.glossaryId ? options.glossaryId : options.glossaryName}"...`);
          const outcome = await exportGlossarySchemaToFile(
            options.glossaryId,
            options.glossaryName,
            options.file,
            options.metadata,
            options.modifiedProperties,
            objectType
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all glossaries to a single file...');
          const outcome = await exportGlossarySchemasToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            {includeInternal: options.internal},
            objectType,
          )
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all glossaries to separate files...');
          const outcome = await exportGlossarySchemasToFiles(
            options.metadata,
            options.modifiedProperties,
            {includeInternal: options.internal},
            objectType,
          );
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );
  return program;
}
