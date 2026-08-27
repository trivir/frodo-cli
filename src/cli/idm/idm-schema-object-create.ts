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
    .description('Create IDM managed object schema definition.')
    .addOption(
      new Option(
        '-o, --managed-object <type>',
        'Managed object type. E.g. "alpha_widget".'
      ).makeOptionMandatory()
    )
    .addOption(
      new Option('--title <text>', 'Display title.').makeOptionMandatory()
    )
    .addOption(
      new Option(
        '--icon <icon>',
        'Display icon. Defaults to a generic icon if not passed.'
      )
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
            `Creating managed object type "${options.managedObject}"...`
          );
          const outcome = await createManagedObjectType(
            options.managedObject,
            options.title,
            options.icon,
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
