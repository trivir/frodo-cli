import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportPasswordPolicy } from '../../../configManagerOps/FrConfigPasswordPolicyOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager pull password-policy',
    [],
    deploymentTypes
  );

  program
    .description('Export password-policy objects.')
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Specifies the realm to export from. Only the entity object from this realm will be exported.'
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
      if (options.realm) {
        realm = options.realm;
      }
      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);
      verboseMessage('Exporting config entity password-policy');
      const outcome = await configManagerExportPasswordPolicy(realm);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
