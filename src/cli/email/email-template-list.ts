import { frodo } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { listEmailTemplates } from '../../ops/EmailTemplateOps';
import { assertDeploymentType } from '../../ops/utils/OpsUtils';
import { verboseMessage } from '../../utils/Console.js';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

export default function setup() {
  const program = new FrodoCommand('frodo email template list');

  program
    .description('List email templates.')
    .addOption(
      new Option('-l, --long', 'Long with all fields.').default(false, 'false')
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
        // require platform deployment type
        if (
          !(await getTokens()) ||
          !assertDeploymentType(
            CLOUD_DEPLOYMENT_TYPE_KEY,
            FORGEOPS_DEPLOYMENT_TYPE_KEY
          )
        ) {
          program.help();
          process.exitCode = 1;
          return;
        }
        verboseMessage(`Listing email templates ...`);
        const outcome = await listEmailTemplates(options.long);
        if (!outcome) process.exitCode = 1;
      }
      // end command logic inside action handler
    );

  return program;
}
