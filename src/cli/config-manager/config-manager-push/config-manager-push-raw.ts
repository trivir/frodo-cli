import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportRaw } from '../../../configManagerOps/FrConfigRawOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { FrodoCommand } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager push raw',
    [],
    deploymentTypes
  );

  program
    .description('Import raw configurations to the tenant.')
    .addOption(
      new Option(
        '-p, --config-path <path>',
        'The path of the service object config file. '
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

      if (await getTokens(false, true, deploymentTypes)) {
        const outcome: boolean = await configManagerImportRaw(options.path);

        if (!outcome) {
          process.exitCode = 1;
        }
      }
    });

  return program;
}
