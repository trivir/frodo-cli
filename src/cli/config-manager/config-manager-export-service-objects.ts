import { Option } from 'commander';

import { configManagerExportServiceObjectsFromFile } from '../../configManagerOps/FrConfigServiceObjectsOps';
import { getTokens } from '../../ops/AuthenticateOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const deploymentTypes = ['cloud', 'forgeops'];

export default function setup() {
  const program = new FrodoCommand(
    'frodo config-manager export service-objects',
    [],
    deploymentTypes
  );

  program
    .description('Export service objects.')
    .addOption(
      new Option(
        '-f, --file <file>',
        'The file path of the service object config file. '
      )
    )
    // To do: export all users/roles

    // .addOption(
    //   new Option(
    //     '-T, --object-type <objectType>',
    //     'The type of the object. ex) alpha_user'
    //   )
    // )

    // .addOption(
    //   new Option(
    //     '-S, --search-field <searchField>',
    //     'The field to have search for the search value. '
    //   )
    // )
    // .addOption(
    //   new Option(
    //     '-V, --search-value <searchValue>',
    //     'The value to search with from search field'
    //   )
    // )
    // .addOption(
    //   new Option(
    //     '-F, --fields <fields>',
    //     'The specific fields you want to retrieve from the service object'
    //   )
    // )
    // .addOption(
    //   new Option(
    //     '--override-fields <overrideFields>',
    //     'The field to override the value to '
    //   )
    // )
    // .addOption(
    //   new Option(
    //     '--override-value <overrideValue>',
    //     'The value to override in the override field'
    //   )
    // )

    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      if (options.file && (await getTokens(false, true, deploymentTypes))) {
        verboseMessage('Exporting service objects');
        const outcome = await configManagerExportServiceObjectsFromFile(
          options.file
        );
        if (!outcome) process.exitCode = 1;
      }
      // else if(
      //   options.type &&
      //   options.searchField &&
      //   options.searchValue &&
      //   options.fields &&
      //   await getTokens(false, true, deploymentTypes)){
      //     verboseMessage('Exporting service objects');
      //   const outcome = await configManagerExportServiceObject(
      //     options.type,
      //     options.searchField,
      //     options.searchValue,
      //     options.fields,
      //     options.overrideField,
      //     options.overrideValue
      //   );
      //   if (!outcome) process.exitCode = 1;
      //   }
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
