import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { updateManagedObjectSchemaPropertyCli } from '../../ops/IdmOps';
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
    'frodo idm schema object property update',
    [],
    deploymentTypes
  );

  program
    .description(
      'Update an existing schema property on a managed-object type. Refuses if the property does not exist. Prints a current/proposed preview and prompts for confirmation, unless -y/--yes is passed.'
    )
    .addOption(
      new Option(
        '-o, --managed-object <type>',
        'Managed object type. E.g. "alpha_user".'
      ).makeOptionMandatory()
    )
    .addOption(
      new Option(
        '-p, --property <name>',
        'Schema property name. E.g. "custom_merchantId".'
      ).makeOptionMandatory()
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'File containing the updated property definition.'
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
            `Updating schema property "${options.property}" on "${options.managedObject}" from ${options.file}...`
          );
          const outcome = await updateManagedObjectSchemaPropertyCli(
            options.managedObject,
            options.property,
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
