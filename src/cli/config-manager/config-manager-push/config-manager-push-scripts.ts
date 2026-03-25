import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerImportScripts } from '../../../configManagerOps/FrConfigScriptOps';
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
    'frodo config-manager push scripts',
    deploymentTypes
  );

  program
    .description('Import scripts to forgeops.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'Script name, import only specified endpoint'
      )
    )
    .addOption(
      new Option(
        '-r, --realm <realm>',
        'Realm name, import only specified realm'
      )
    );

  program.action(async (host, realm, user, password, options, command) => {
    command.handleDefaultArgsAndOpts(
      host,
      realm,
      user,
      password,
      options,
      command
    );

    if (!(await getTokens(false, true, deploymentTypes))) {
      process.exitCode = 1;
      return;
    }

    const outcome = await configManagerImportScripts(
      options.realm,
      options.name
    );
    if (!outcome) process.exitCode = 1;
  });

  return program;
}
