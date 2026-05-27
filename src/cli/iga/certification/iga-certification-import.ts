import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importCertificationFromFile,
  importCertificationsFromFile,
  importCertificationsFromFiles,
  importFirstCertificationFromFile,
} from '../../../ops/cloud/iga/IgaCertificationOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga certification import',
    [],
    deploymentTypes
  );

  program
    .description('Import certifications.')
    .addOption(
      new Option(
        '-i, --certification-id <certification-id>',
        'Certification id. If specified, -n, -a, and -A cannot be used.'
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
        '-f, --file <file>',
        'Name of the import file. Cannot be used with -A.'
      ).conflicts(['allSeparate'])
    )
    .addOption(
      new Option(
        '-a, --all',
        'Import all certifications from single file. Cannot be used with -i, -n, and -A.'
      ).conflicts(['certificationId', 'certificationName', 'allSeparate'])
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all certifications from separate files (*.certification.json) in the current directory. Cannot be used with -i, -n, -a and -f.'
      ).conflicts(['certificationId', 'all', 'allSeparate', 'file'])
    )
    .addOption(
      new Option(
        '--no-deps',
        'Do not import any dependencies (email templates).'
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
        const isImportById = options.certificationId && options.file;
        const isImportByName = options.certificationName && options.file;
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

        // import by id || import by name
        if (isImportById || isImportByName) {
          verboseMessage(
            `Importing certification "${options.certificationId ? options.certificationId : options.certificationName}"...`
          );
          const outcome = await importCertificationFromFile(
            options.certificationId,
            options.certificationName,
            options.file,
            { deps: options.deps }
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (isImportAll) {
          verboseMessage(
            `Importing all certifications from a single file (${options.file})...`
          );
          const outcome = await importCertificationsFromFile(options.file, {
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (isImportAllSeparate) {
          verboseMessage(
            'Importing all certifications from separate files (*.certification.json) in current directory...'
          );
          const outcome = await importCertificationsFromFiles({
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
        // import first certification from file
        else if (isImportFirst) {
          verboseMessage(
            `Importing first certification from file "${options.file}"...`
          );
          const outcome = await importFirstCertificationFromFile(options.file, {
            deps: options.deps,
          });
          if (!outcome) process.exitCode = 1;
        }
      }
      // end program logic inside action handler
    );

  return program;
}
