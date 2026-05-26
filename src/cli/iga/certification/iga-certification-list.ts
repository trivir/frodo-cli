import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { listCertifications } from '../../../ops/cloud/iga/IgaCertificationOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga certification list',
    [],
    deploymentTypes
  );

  program
    .description('List certifications.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
    )
    .addOption(
      new Option(
        '-E, --include-events',
        'Includes certification templates used in IGA events'
      ).default(false, 'false')
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
        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1);

        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1);
        }

        verboseMessage(`Listing certifications ...`);
        const outcome = await listCertifications(
          options.long,
          options.includeEvents
        );
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
