import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportAuthzPolicies } from '../../../configManagerOps/FrConfigAuthzPoliciesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';



export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push authz-policies',
    
  );

  program
    .description('Import authorization policies.')
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

      const getTokensIsSuccessful = await getTokens();
      if (!getTokensIsSuccessful) process.exit(1);
      printMessage(
        `Importing organization privileges config for authz policies`
      );
      const outcome = await configManagerImportAuthzPolicies(options.name);

      if (!outcome) process.exitCode = 1;
    });

  return program;
}
