import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { updateManagedObjectTypeCli } from '../../ops/IdmOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo idm schema object update',
    [],
    deploymentTypes
  );

  program
    .description(
      'Update an existing managed-object type from a file. The type name comes from the file\'s own "name" field. Refuses if that type does not exist. Prompts for confirmation before updating schema-bearing changes, unless -y/--yes is passed.'
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'File containing the updated type definition, including its "name".'
      ).makeOptionMandatory()
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
        if (await getTokens(false, true, deploymentTypes)) {
          verboseMessage(
            `Updating managed object type from ${options.file}...`
          );
          const outcome = await updateManagedObjectTypeCli(
            options.file,
            options.yes
          );
          if (!outcome) process.exitCode = 1;
        } else {
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
