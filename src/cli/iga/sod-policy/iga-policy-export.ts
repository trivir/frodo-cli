import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  exportPoliciesToFile,
  exportPoliciesToFiles,
  exportPolicyToFile,
} from '../../../ops/cloud/iga/IgaSodPolicyOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga sod policy export',
    [],
    deploymentTypes
  );

  program
    .description('Export SoD policies.')
    .addOption(
      new Option(
        '-n, --policy-name <policy-name>',
        'Policy name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the export file. Ignored with -A. Defaults to <policy-name>.policy.json.'
      )
    )
    .addOption(
      new Option(
        '-a, --all',
        'Export all policies to a single file. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all policies as separate files <name>.policy.json. Ignored with -n and -a.'
      )
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
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );
      if (!options.policyName && !options.all && !options.allSeparate) {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
        return;
      }
      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) {
        printMessage('Error getting tokens', 'error');
        process.exitCode = 1;
        return;
      }
      if (!state.getIsIGA()) {
        printMessage(
          'Command not supported for non-IGA cloud tenants',
          'error'
        );
        process.exitCode = 1;
        return;
      }
      // --policy-name -n
      if (options.policyName) {
        verboseMessage(`Exporting policy "${options.policyName}"...`);
        const outcome = await exportPolicyToFile(
          options.policyName,
          options.file,
          options.metadata,
          options.modifiedProperties
        );
        if (!outcome) process.exitCode = 1;
      }
      // --all -a
      else if (options.all) {
        verboseMessage('Exporting all policies to a single file...');
        const outcome = await exportPoliciesToFile(
          options.file,
          options.metadata,
          options.modifiedProperties
        );
        if (!outcome) process.exitCode = 1;
      }
      // --all-separate -A
      else if (options.allSeparate) {
        verboseMessage('Exporting all policies to separate files...');
        const outcome = await exportPoliciesToFiles(
          options.metadata,
          options.modifiedProperties
        );
        if (!outcome) process.exitCode = 1;
      }
    });

  return program;
}
