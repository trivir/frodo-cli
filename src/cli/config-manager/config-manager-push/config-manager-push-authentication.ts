import { Option } from 'commander';

import { configManagerImportAuthentication } from '../../../configManagerOps/FrConfigAuthenticationOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push authentication',
    [],
    deploymentTypes
  );

  program
    .description('Import authentication objects.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to import to. Only the entity object from this realm will be imported.'
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
      if (options.realm) {
        realm = options.realm;
      }
      if (await getTokens(false, true, deploymentTypes)) {
        verboseMessage('Importing config entity authentication');
        const outcome = await configManagerImportAuthentication(realm);
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
