import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { validateFeature } from '../../ops/FeatureOps';
import { verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;

const deploymentTypes = [CLOUD_DEPLOYMENT_TYPE_KEY];

export default function setup() {
  const program = new FrodoCommand(
    'frodo feature validate',
    ['realm'],
    deploymentTypes
  );

  program
    .description(
      'Validate whether an IDM tenant-configuration feature is installable, without installing it.'
    )
    .addOption(
      new Option(
        '-i, --feature-id <id>',
        'Feature id. E.g. "aiagent", "groups".'
      ).makeOptionMandatory()
    )
    .action(
      // implement command logic inside action handler
      async (host, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          user,
          password,
          options,
          command
        );
        if (await getTokens(false, true, deploymentTypes)) {
          verboseMessage(`Validating feature "${options.featureId}"...`);
          const outcome = await validateFeature(options.featureId);
          if (!outcome) process.exitCode = 1;
        } else {
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
