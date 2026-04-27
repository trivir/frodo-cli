import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { deleteSaml2Provider, deleteSaml2Providers } =
  frodo.saml2.entityProvider;

export default function setup() {
  const program = new FrodoCommand('frodo saml delete');

  program
    .description('Delete SAML entity providers.')
    .addOption(
      new Option(
        '-i, --entity-id <entity-id>',
        'Entity id. If specified, -a is ignored.'
      )
    )
    .addOption(
      new Option('-a, --all', 'Delete all entity providers. Ignored with -i.')
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
        if (!options.entityId && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        // -i / --entity-id
        if (options.entityId) {
          verboseMessage(`Deleting entity provider '${options.entityId}'...`);
          await deleteSaml2Provider(options.entityId);
        }
        // -a / --all
        else if (options.all) {
          verboseMessage(`Deleting all entity providers...`);
          await deleteSaml2Providers();
        }
      }
    );

  return program;
}
