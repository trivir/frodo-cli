import { state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { addCustomDomain } from '../../ops/RealmOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo realm add-custom-domain');

  program
    .description('Add custom domain (realm DNS alias).')
    .addOption(
      new Option(
        '-d, --domain <name>',
        'Custom DNS domain name.'
      ).makeOptionMandatory()
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
        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);
        verboseMessage(
          `Adding custom DNS domain ${
            options.domain
          } to realm ${state.getRealm()}...`
        );
        await addCustomDomain(state.getRealm(), options.domain);
      }
      // end command logic inside action handler
    );

  return program;
}
