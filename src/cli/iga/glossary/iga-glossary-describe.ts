import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeGlossary } from '../../../ops/cloud/iga/IgaGlossaryOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';
import { GlossaryObjectType } from '@rockcarver/frodo-lib/types/api/cloud/iga/IgaGlossaryApi';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

const glossaryTypeMap: Record<string, GlossaryObjectType> = {
  role: '/openidm/managed/role',
  entitlement: '/openidm/managed/assignment',
  application: '/openidm/managed/application',
  account: '/iga/governance/account',
};

export default function setup() {
  const program = new FrodoCommand('frodo iga glossary describe');

  program
    .description('Describe glossaries.')
    .addOption(
      new Option(
        '-i, --glossary-id <glossary-id>',
        'glossary id. If not specified, will describe first glossary in the provided export file.'
      ).conflicts(['glossaryName'])
    )
    .addOption(
      new Option(
        '-n, --glossary-name <glossary-name>',
        'Specify a glossary name. If specified, -i cannot be used.'
      ).conflicts(['glossaryId'])
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the glossary export file to describe. If not specified, will automatically pull the glossary export data of the provided id from the tenant.'
      )
    )
    .addOption(
      new Option(
        '-t, --glossary-type <type>',
        'Filter glossary schema by type: role, entitlement, application, or account'
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
      if (!options.glossaryId && !options.glossaryName && !options.file) {
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
        : undefined;
      if (options.glossaryType && !objectType) {
        printMessage('Please provide a valid Object Type', 'error');
        process.exitCode = 1;
        program.help();
      }
      verboseMessage(`Describing glossary ${options.glossaryName ? options.glossaryId : options.glossaryName}...`);
      const outcome = await describeGlossary(options.glossaryId, options.glossaryName, objectType, options.file);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
