import { FrodoCommand } from '../FrodoCommand';
import { Option } from 'commander';
import { frodo } from '@rockcarver/frodo-lib';
import {verboseMessage} from "../../utils/Console";
import {exportEverythingToFile, exportEverythingToFiles} from "../../ops/AdminOps";

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo admin export');

program
  .description('Export everything.')
  .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
  .addOption(
    new Option(
      '-a, --all',
      'Export everything to a single file.'
    )
  )
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export everything to separate files in the current directory. Ignored with -a.'
    )
  )
  .addOption(new Option('-g, --global', 'Export global services.'))
  .addOption(
    new Option(
      '--use-string-arrays',
      'Where applicable, use string arrays to store multi-line text (e.g. scripts).'
    ).default(false, 'off')
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
      const globalConfig = options.global ?? false;
      // --all -a
      if (options.all && (await getTokens())) {
        verboseMessage('Exporting everything to a single file...');
        await exportEverythingToFile(options.file, globalConfig, options.useStringArrays);
      // --all-separate -A
      } else if (options.allSeparate && (await getTokens())) {
        verboseMessage('Exporting everything to separate files...');
        await exportEverythingToFiles(globalConfig, options.useStringArrays);
        // unrecognized combination of options or no options
      } else {
        verboseMessage('Unrecognized combination of options or no options...');
        program.help();
        process.exitCode = 1;
      }
    }
    // end command logic inside action handler
  );

program.parse();
