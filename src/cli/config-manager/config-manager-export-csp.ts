import { Option } from 'commander';

import { exportCsp } from '../../configManagerOps/FrConfigCspOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export cps',
    [],
    deploymentTypes
  );

  program
    .description('Export content security policy.')
    /** 
     * added because fr-config manager has an option to use a config file for the "fr-config-pull csp" command. Bryan said this should still be supported
     * 
     * -----------------------  Example CSP_OVERRIDES json file ----------------------------------
    {
      "enforced": {
        "active": {
          "$bool": "${CSP_ENFORCED}"
        }
      },
      "report-only": {
        "active": {
          "$bool": "${CSP_REPORT_ONLY}"
        }
      }
    }
     * -------------------------------------------------------------------------------------------- 
     */
    .addOption(
      new Option(
        '-f, --file <file>',
        'The CSP_OVERRIDES json file. ex: "/home/trivir/Documents/csp-overrides.json", or "csp-overrides.json"'
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
        verboseMessage('Exporting content security policy');
        const outcome = await exportCsp(options.file);
        if (!outcome) process.exitCode = 1;
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
