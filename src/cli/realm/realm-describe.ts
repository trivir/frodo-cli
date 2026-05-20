import { frodo, state } from '@rockcarver/frodo-lib';

import { getTokens } from '../../ops/AuthenticateOps';
import { describeRealm } from '../../ops/RealmOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo realm describe');

  program.description('Describe realms.').action(
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
      verboseMessage(`Retrieving details of realm ${state.getRealm()}...`);
      describeRealm(frodo.utils.getRealmName(state.getRealm()));
    }
    // end command logic inside action handler
  );

  return program;
}
