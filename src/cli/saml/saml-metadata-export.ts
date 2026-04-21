import { state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { exportSaml2MetadataToFile } from '../../ops/Saml2Ops';
import { printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

export default function setup() {
  const program = new FrodoCommand('frodo saml metadata export');

  program
    .description('Export SAML metadata.')
    .addOption(
      new Option(
        '-i, --entity-id <entity-id>',
        'Entity id. If specified, -a and -A are ignored.'
      )
    )
    .addOption(
      new Option(
        '-f, --file [file]',
        'Name of the file to write the exported metadata to. Ignored with -A. If not specified, the export file is named <entity-id>.metadata.xml.'
      )
    )
    // .addOption(
    //   new Option(
    //     '-A, --all-separate',
    //     'Export all the providers in a realm as separate files <provider name>.saml.json. Ignored with -t, -i, and -a.'
    //   )
    // )
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
        if (!options.entityId) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          process.exitCode = 1;
          program.help();
        }
        const getTokensIsSuccessful = await getTokens();
        if (!getTokensIsSuccessful) process.exit(1);

        // export by id/name
        if (options.entityId) {
          printMessage(
            `Exporting metadata for provider "${
              options.entityId
            }" from realm "${state.getRealm()}"...`
          );
          const outcome = await exportSaml2MetadataToFile(
            options.entityId,
            options.file
          );
          if (!outcome) process.exitCode = 1;
        }
        // // --all-separate -A
        // else if (options.allSeparate) {
        //   printMessage('Exporting all providers to separate files...');
        //   exportProvidersToFiles();
        // }
      }
    );

  return program;
}
