
import { Argument} from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export raw',
    ['realm', 'username', 'password'],
    deploymentTypes
  );

  program
    .description('Export raw configurations from the tenant.')
    /**
     * added because fr-config manager needs a config in order to complete the "fr-config-pull raw command.
     *   
     * -----------------------  Example RAW_CONFIG json file ------------------------
    [ 
      { "path": "/openidm/config/authentication" },
      {
        "path": "/am/json/realms/root/realms/alpha/realm-config/webhooks/test-webhook",
        "overrides": { "url": "${TEST_WEBHOOK_URL}" },
        "pushApiVersion": {
          "protocol": "2.0",
          "resource": "1.0"
        }
      }
    ]
     * -------------------------------------------------------------------------------------------- 
     */
    .addArgument(
      new Argument(
        '<configFile>',
        'The RAW_CONFIG json file. ex: "/home/trivir/Documents/raw.json", or "raw.json"'
      )
    )
    .action(async (configFile, host, options, command,) => {
      printMessage(configFile);
      command.handleDefaultArgsAndOpts(
        configFile,
        host,
        options,
        command
      );

      if (await getTokens(false, true, deploymentTypes)) {
        let outcome: boolean = false;



        printMessage(options);

        if (!outcome) {
          printMessage(
            `Failed to export one or more authorization policy sets. ${options.verbose ? '' : 'Check --verbose for me details.'}`
          );
          process.exitCode = 1;
        }
      }

      // unrecognized combination of options or no options
      else {
        printMessage(
          'Unrecognized combination of options or no options...',
          'error'
        );
        program.help();
        process.exitCode = 1;
      }
    });

  return program;
}
