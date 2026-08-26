import { frodo, FrodoError } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import {
  type RelationshipPropertyFields,
  updateManagedObjectSchemaRelationshipPropertyCli,
} from '../../ops/IdmOps';
import { printError, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export default function setup() {
  const program = new FrodoCommand(
    'frodo idm schema relationship update',
    [],
    deploymentTypes
  );

  program
    .description(
      'Update an existing relationship schema property, via the dedicated Cloud-only v2 schema API. Refuses if the property does not exist. Only the fields whose flags are passed change; everything else keeps its current value. Prints a current/proposed preview and prompts for confirmation, unless -y/--yes is passed.'
    )
    .addOption(
      new Option(
        '-o, --managed-object <type>',
        'Managed object type. E.g. "alpha_aiagentprivilege".'
      ).makeOptionMandatory()
    )
    .addOption(
      new Option(
        '-p, --property <name>',
        'Relationship property name. E.g. "agent".'
      ).makeOptionMandatory()
    )
    .addOption(
      new Option(
        '--target-object <type>',
        'Change the managed object type this relationship points to.'
      )
    )
    .addOption(
      new Option('--many', 'Change to a to-many (array) relationship.')
    )
    .addOption(
      new Option('--single', 'Change to a to-one (single) relationship.')
    )
    .addOption(
      new Option(
        '--query-fields <csv>',
        'Change the comma-separated list of fields fetched from the target object.'
      )
    )
    .addOption(new Option('--title <text>', 'Change the display title.'))
    .addOption(
      new Option('--description <text>', 'Change the display description.')
    )
    .addOption(
      new Option('--label <text>', 'Change the resource collection label.')
    )
    .addOption(
      new Option(
        '--query-filter <filter>',
        'Change the query filter applied against the target object.'
      )
    )
    .addOption(
      new Option(
        '--sort-keys <csv>',
        'Change the comma-separated list of sort keys.'
      )
    )
    .addOption(
      new Option(
        '--notify',
        'Notify the target object of relationship changes.'
      )
    )
    .addOption(
      new Option('--notify-self', 'Notify this object of relationship changes.')
    )
    .addOption(new Option('--searchable', 'Mark the property searchable.'))
    .addOption(
      new Option('--user-editable', 'Allow end users to edit this property.')
    )
    .addOption(new Option('--not-viewable', 'Hide this property from views.'))
    .addOption(
      new Option('--not-validate', 'Skip target-existence validation on write.')
    )
    .addOption(
      new Option(
        '--return-by-default',
        'Return this property by default on reads.'
      )
    )
    .addOption(
      new Option(
        '--reverse-property-name <name>',
        'Change the reverse property name this relationship points back at on --target-object.'
      )
    )
    .addOption(
      new Option(
        '--with-reverse',
        "Also apply the same explicitly-passed field overrides to the reverse side, inferred from this property's own current definition. Errors if no reverse relationship is configured."
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
        if (options.many && options.single) {
          printError(
            new FrodoError('Pass only one of --many or --single, not both.')
          );
          process.exitCode = 1;
          return;
        }
        if (await getTokens(false, true, deploymentTypes)) {
          verboseMessage(
            `Updating relationship property "${options.property}" on "${options.managedObject}"...`
          );
          const changedFields: Partial<RelationshipPropertyFields> = {
            targetObject: options.targetObject,
            many: options.many ? true : options.single ? false : undefined,
            queryFields: options.queryFields
              ? splitCsv(options.queryFields)
              : undefined,
            title: options.title,
            description: options.description,
            label: options.label,
            queryFilter: options.queryFilter,
            sortKeys: options.sortKeys ? splitCsv(options.sortKeys) : undefined,
            notify: options.notify ? true : undefined,
            notifySelf: options.notifySelf ? true : undefined,
            searchable: options.searchable ? true : undefined,
            userEditable: options.userEditable ? true : undefined,
            notViewable: options.notViewable ? true : undefined,
            notValidate: options.notValidate ? true : undefined,
            returnByDefault: options.returnByDefault ? true : undefined,
            reversePropertyName: options.reversePropertyName,
          };
          const outcome =
            await updateManagedObjectSchemaRelationshipPropertyCli(
              options.managedObject,
              options.property,
              changedFields,
              options.yes,
              options.withReverse
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
