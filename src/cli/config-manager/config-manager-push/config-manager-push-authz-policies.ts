import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportAuthzPolicy } from '../../../configManagerOps/FrConfigAuthzPoliciesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push authz-policies',
    deploymentTypes
  );

  program
    .description('Import authorization policies.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to import from. Only policy sets from this realm will be imported.'
      )
    )
    .addOption(
      new Option(
        '-n, --policy-name <set-name>',
        'Policy set name. If specified, only the policy set with the specified name is imported.'
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

      if (options.name && !options.realm) {
        printMessage(
          'The -n/--policy-name option requires -r/--realm to be specified.',
          'error'
        );
        program.help();
        process.exitCode = 1;
        return;
      }

      if (await getTokens(false, true, deploymentTypes)) {
        printMessage(
          `Importing organization privileges config for authz policies`
        );
        const outcome = await configManagerImportAuthzPolicy(
          options.realm,
          options.name
        );
        if (!outcome) process.exitCode = 1;
      } else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
      }
    });

  return program;
}
