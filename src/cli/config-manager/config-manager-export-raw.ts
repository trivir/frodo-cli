
import { Argument} from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';
import { configManagerExportRaw } from '../../configManagerOps/FrConfigRawOps';

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
     * Made it a required argument instead of an option because its much easier to just write a config file than
     * pasting in the contents of the raw_config file as option in the command line
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
    .action(async ( host, configFile, options, command,) => {

      command.handleDefaultArgsAndOpts(
        
        host,
        configFile,
        options,
        command
      );

      if (await getTokens(false, true, deploymentTypes)) {
        const outcome: boolean = await configManagerExportRaw(configFile);

        if (!outcome) {
          printMessage(
            `Failed to export one or more config files. ${options.verbose ? '' : 'Check --verbose for me details.'}`
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
