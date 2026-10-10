import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeRequestForm } from '../../../ops/cloud/iga/IgaRequestFormsOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;
const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga request-form describe');
  program
    .description('Describe request form.')
    .addOption(
      new Option(
        '-n, --request-form-name <name>',
        'Request form name. If not specified, will describe the first request form in the provided export file.'
      )
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Request form file. If not specified, will describe the first request form in the provided export file.'
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
      if (!options.name && !options.file) {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
        return;
      }
      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) {
        printMessage('Error getting tokens', 'error');
        process.exitCode = 1;
        return;
      }
      if (!state.getIsIGA()) {
        printMessage(
          'Command not supported for non-IGA cloud tenants',
          'error'
        );
        process.exitCode = 1;
        return;
      }
      verboseMessage(`Describing request form ${options.name}...`);
      const outcome = await describeRequestForm(options.name, options.file);
      if (!outcome) process.exitCode = 1;
    });
  return program;
}
