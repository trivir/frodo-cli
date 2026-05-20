import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  exportInternalRolesToFile,
  exportInternalRolesToFiles,
  exportInternalRoleToFile,
} from '../../ops/InternalRoleOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand('frodo role export', [], deploymentTypes);

  program
    .description('Export internal roles.')
    .addOption(
      new Option(
        '-i, --role-id <role-id>',
        'Internal role id. If specified, only one internal role is exported and the options -n, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-n, --role-name <role-name>',
        'Internal role name. If specified, only one internal role is exported and the options -a and -A are ignored.'
      )
    )
    .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
    .addOption(
      new Option(
        '-a, --all',
        'Export all internal roles to a single file. Ignored with -i.'
      )
    )
    .addOption(
      new Option(
        '-A, --all-separate',
        'Export all internal roles to separate files (*.internalRole.json) in the current directory. Ignored with -i or -a.'
      )
    )
    .addOption(
      new Option(
        '-N, --no-metadata',
        'Does not include metadata in the export file.'
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
          !options.roleId &&
          !options.roleName &&
          !options.file &&
          !options.allSeparate &&
          !options.all
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

        // export by id or name
        if (options.roleId || options.roleName) {
          verboseMessage(
            `Exporting internal role ${options.roleId || options.roleName}...`
          );
          const outcome = await exportInternalRoleToFile(
            options.roleId,
            options.roleName,
            options.file,
            options.metadata
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage(`Exporting all internal roles to a single file...`);
          const outcome = await exportInternalRolesToFile(
            options.file,
            options.metadata
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all-separate -A
        else if (options.allSeparate) {
          verboseMessage('Exporting all internal roles to separate files...');
          const outcome = await exportInternalRolesToFiles(options.metadata);
          if (!outcome) process.exitCode = 1;
        }
      }
    );

  return program;
}
