import { frodo, state } from '@rockcarver/frodo-lib';
import { GlossaryObjectType } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaGlossaryApi';
import { Option } from 'commander';
import { getTokens } from '../../../ops/AuthenticateOps';
import { listGlossary } from '../../../ops/cloud/iga/IgaGlossaryOps';
import { printMessage, verboseMessage } from '../../../utils/Console.js';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

const glossaryTypeMap: Record<string, GlossaryObjectType> = {
  role: '/openidm/managed/role',
  entitlement: '/openidm/managed/assignment',
  application: '/openidm/managed/application',
  account: '/iga/governance/account',
};

export default function setup() {
  const program = new FrodoCommand(
    'frodo iga glossary list',
    [],
    deploymentTypes
  );

  program
    .description('List glossaries.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
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

        const getTokensIsSuccessful = await getTokens(
          false,
          true,
          deploymentTypes
        );
        if (!getTokensIsSuccessful) process.exit(1)
        
        if (!state.getIsIGA()) {
          printMessage(
            'Command not supported for non-IGA cloud tenants',
            'error'
          );
          process.exit(1)
        }
        
        const objectType = options.glossaryType
          ? glossaryTypeMap[options.glossaryType]
          : null;
        if (options.glossaryType && !objectType) {
          printMessage('Please provide a valid Object Type', 'error');
          process.exitCode = 1;
          program.help();
        }
        verboseMessage(`Listing Glossaries ...`);
        const outcome = await listGlossary(options.long, objectType);
        if (!outcome) process.exit(1);
      }
      // end command logic inside action handler
    );

  return program;
}
