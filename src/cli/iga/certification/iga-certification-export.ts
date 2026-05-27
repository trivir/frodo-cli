import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportCertificationsToFile,
  exportCertificationsToFiles,
  exportCertificationToFile,
} from '../../../ops/cloud/iga/IgaCertificationOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga certification export',
    [],
    deploymentTypes
  );

  program
    .description('Export certifications.')
    .addOption(
      new Option(
        '-i, --certification-id <certification-id>',
        'Certification id. If specified, -n, -a and -A cannot be used.'
      ).conflicts(['certificationName', 'all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-n, --certification-name <certification-name>',
        'Certification name. If specified, -i, -a and -A cannot be used.'
      ).conflicts(['certificationId', 'all', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <certification-name>.certification.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all certifications to a single file. Cannot be used with -i, -n, and -A.'
      ).conflicts(['certificationId', 'certificationName', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all certifications as separate files <certification-name>.certification.json. Cannot be used with -i, -n and -a.'
      ).conflicts(['certificationId', 'certificationName', 'all'])
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
        '--no-deps',
        'Do not include any dependencies (email templates, request forms, events, etc.).'
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
          !options.certificationId &&
          !options.certificationName &&
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

        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }

        let outcome;

        // --certification-id -i || --certification-name -n
        if (options.certificationId || options.glossaryName) {
          verboseMessage(
            `Exporting certification "${options.certificationId ? options.certificationId : options.certificationName}"...`
          );
          outcome = await exportCertificationToFile(
            options.certificationId,
            options.certficationName,
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              includeEventTemplates: options.deps,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Exporting all certifications to a single file...');
          outcome = await exportCertificationsToFile(
            options.file,
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              includeEventTemplates: options.deps,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all certifications to separate files...');
          outcome = await exportCertificationsToFiles(
            options.metadata,
            options.modifiedProperties,
            {
              deps: options.deps,
              includeEventTemplates: options.deps,
            }
          );
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
