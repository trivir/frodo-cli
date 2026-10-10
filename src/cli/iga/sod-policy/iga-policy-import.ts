import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  importFirstPolicyFromFile,
  importPoliciesFromFile,
  importPoliciesFromFiles,
  importPolicyFromFile,
} from '../../../ops/cloud/iga/IgaSodPolicyOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga sod policy import',
    [],
    deploymentTypes
  );

  program
    .description('Import SoD policies.')
    .addOption(
      new Option(
        '-n, --policy-name <policy-name>',
        'Policy name. If specified, -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the import file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Import all policies from a single file. Ignored with -n.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Import all policies from separate files (*.policy.json) in the current directory. Ignored with -n or -a.'
      )
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
      const isImportByName = options.policyName && options.file;
      const isImportAll = options.all && options.file;
      const isImportAllSeparate = options.allSeparate && !options.file;
      const isImportFirst = !!options.file;
      if (
        !isImportByName &&
        !isImportAll &&
        !isImportAllSeparate &&
        !isImportFirst
      ) {
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
      // import by name
      if (isImportByName) {
        verboseMessage(`Importing policy "${options.policyName}"...`);
        const outcome = await importPolicyFromFile(
          options.policyName,
          options.file
        );
        if (!outcome) process.exitCode = 1;
      }
      // --all -a
      else if (isImportAll) {
        verboseMessage(
          `Importing all policies from a single file (${options.file})...`
        );
        const outcome = await importPoliciesFromFile(options.file);
        if (!outcome) process.exitCode = 1;
      }
      // --all-separate -A
      else if (isImportAllSeparate) {
        verboseMessage(
          'Importing all policies from separate files (*.policy.json) in current directory...'
        );
        const outcome = await importPoliciesFromFiles();
        if (!outcome) process.exitCode = 1;
      }
      // import first policy from file
      else if (isImportFirst) {
        verboseMessage(`Importing first policy from file "${options.file}"...`);
        const outcome = await importFirstPolicyFromFile(options.file);
        if (!outcome) process.exitCode = 1;
      }
    });

  return program;
}
