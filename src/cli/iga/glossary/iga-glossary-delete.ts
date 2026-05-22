import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import {
  deleteGlossarySchema,
  deleteGlossarySchemas,
} from '../../../ops/cloud/iga/IgaGlossaryOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';
import { GlossaryObjectType } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaGlossaryApi';
import { object } from 'zod';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

const glossaryTypeMap: Record<string, GlossaryObjectType> = {
  role: '/openidm/managed/role',
  entitlement: '/openidm/managed/assignment',
  application: '/openidm/managed/application',
  account: '/iga/governance/account',
};

export default function setup() {
  const program = new FrodoCommand('frodo iga glossary delete');

  program
    .description('Delete glossaries.')
    .addOption(
      new Option(
        '-i, --glossary-id <glossary-id>',
        'glossary id. If specified, -n and -a cannot be used. '
      ).conflicts(['glossaryName', 'all'])
    ).addOption(
      new Option(
        '-n, --glossary-name <glossary-name>',
        'Specify a glossary name. If specified, -i cannot be used.'
      ).conflicts(['glossaryId'])
    )
    .addOption(
      new Option(
        '-a, --all',
        'Delete all glossaries. Cannot be used with -a and -i.'
      ).conflicts(['glossaryName', 'glossaryId'])
    )
    .addOption(
      new Option(
        '-t, --glossary-type <type>',
        'Filter glossary schema by type: role, entitlement, application, or account'
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
        if (!options.glossaryId && !options.glossaryName && !options.all) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
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
        const objectType = options.glossaryType
          ? glossaryTypeMap[options.glossaryType]
          : null;

        if (options.glossaryType && !objectType) {
          printMessage('Please provide a valid Object Type', 'error');
          process.exitCode = 1;
          program.help();
        }

        // delete by id
        if (options.glossaryId || options.glossaryName) {
          verboseMessage('Deleting glossary...');
          console.log("CLI: NAME", options.glossaryName)
          const outcome = await deleteGlossarySchema(
            options.glossaryId,
            options.glossaryName,
            objectType
          );
          if (!outcome) process.exitCode = 1;
        }
        // --all -a
        else if (options.all) {
          verboseMessage('Deleting all glossaries...');
          const outcome = await deleteGlossarySchemas(objectType);
          if (!outcome) process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
