import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeGlossary } from '../../../ops/cloud/iga/IgaGlossaryOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga glossary describe');

  program
    .description('Describe glossaries.')
    .addOption(
      new Option(
        '-i, --glossary-id <glossary-id>',
        'glossary id. If not specified, will describe first glossary in the provided export file.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the glossary export file to describe. If not specified, will automatically pull the glossary export data of the provided id from the tenant.'
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
      if (!options.glossaryId && !options.file) {
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
      verboseMessage(`Describing glossary ${options.glossaryId}...`);
      const outcome = await describeGlossary(options.glossaryId, options.file);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
