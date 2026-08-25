import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { createManagedObjectType } from '../../ops/IdmOps';
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
    'frodo idm schema object create',
    [],
    deploymentTypes
  );

  program
    .description(
      'Create a new managed-object type from a file. The type name comes from the file\'s own "name" field. Refuses if that type already exists. Prompts for confirmation before creating, unless -y/--yes is passed.'
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'File containing the type definition (schema included), including its "name".'
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
            `Creating managed object type from ${options.file}...`
          );
          const outcome = await createManagedObjectType(
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
