import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  configManagerImportOrgPrivileges,
  configManagerImportOrgPrivilegesAllRealms,
  configManagerImportOrgPrivilegesRealm,
} from '../../../configManagerOps/FrConfigOrgPrivilegesOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];
const { constants } = frodo.utils;

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push org-privileges',
    [],
    deploymentTypes
  );

  program
    .description('Import organization privileges config.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to Import from. Only the entity object from this realm will be Imported.'
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

      // -r flag has precedence
      if (options.realm) {
        realm = options.realm;
      }

      if (await getTokens(false, true, deploymentTypes)) {
        let outcome: boolean;
        if (realm !== constants.DEFAULT_REALM_KEY) {
          printMessage(
            `Importing organization privileges config from the realm: "${realm}"`
          );
          outcome =
            (await configManagerImportOrgPrivileges()) &&
            (await configManagerImportOrgPrivilegesRealm(realm));
        } else {
          printMessage(
            'Importing oranization privileges config from all realms'
          );
          outcome = await configManagerImportOrgPrivilegesAllRealms();
        }

        if (!outcome) process.exitCode = 1;
      }
      // unrecognized combination of options or no options
      else {
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
