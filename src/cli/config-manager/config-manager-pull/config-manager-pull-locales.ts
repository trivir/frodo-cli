import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { configManagerExportLocales } from '../../../configManagerOps/FrConfigLocalesOps';
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
    'frodo config-manager pull locales',
    [],
    deploymentTypes
  );

  program
    .description('Export custom locales objects.')
    .addOption(
      new Option(
        '-n, --name <name>',
        'locale name, It only export the locale with the name'
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

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);
      if (options.name) {
        verboseMessage(
          `Exporting config entity locale with name ${options.name}`
        );
      } else {
        verboseMessage('Exporting config entity locales');
      }
      const outcome = await configManagerExportLocales(options.name);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
