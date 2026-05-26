import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../../ops/AuthenticateOps';
import { describeCertification } from '../../../ops/cloud/iga/IgaCertificationOps';
import { printMessage, verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand('frodo iga certification describe');

  program
    .description('Describe certifications.')
    .addOption(
      new Option(
        '-i, --certification-id <certification-id>',
        'Certification id. If not specified, will describe first certification in the provided export file.'
      ).conflicts(['certificationName'])
    )
    .addOption(
      new Option(
        '-n, --certification-name <certification-name>',
        'Certification name. If not specified, will describe first certification in the provided export file.'
      ).conflicts(['certificationId'])
    )
    .addOption(
      new Option(
        '-f, --file <file>',
        'Name of the certification export file to describe. If not specified, will automatically pull the certification export data of the provided id from the tenant.'
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
      if (!options.certificationId && !options.certificationName && !options.file) {
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

      verboseMessage(`Describing certification ${options.certificationId ? options.certificateId : options.certficationName}...`);
      const outcome = await describeCertification(
        options.certificationId,
        options.certificationName,
        options.file
      );
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
