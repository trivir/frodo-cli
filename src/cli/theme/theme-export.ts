import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import {
  exportThemeById,
  exportThemeByName,
  exportThemesToFile,
  exportThemesToFiles,
} from '../../ops/ThemeOps';
import { printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo theme export');

program
  .description('Export themes.')
  .addOption(
    new Option(
      '-n, --theme-name <name>',
      'Name of the theme. If specified, -a and -A are ignored.'
    )
  )
  .addOption(
    new Option(
      '-i, --theme-id <uuid>',
      'Uuid of the theme. If specified, -a and -A are ignored.'
    )
  )
  .addOption(
    new Option(
      '-f, --file [file]',
      'Name of the file to write the exported theme(s) to. Ignored with -A.'
    )
  )
  .addOption(
    new Option(
      '-a, --all',
      'Export all the themes in a realm to a single file. Ignored with -n and -i.'
    )
  )
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export all the themes in a realm as separate files <theme name>.theme.json. Ignored with -n, -i, and -a.'
    )
  )
  .addOption(
    new Option(
      '-j, --no-metadata',
      'Does not include metadata in the export file.'
    )
  )
  .addOption(
    new Option(
      '-S, --sort',
      'Sorts exported .json file(s) in abc order by key.'
    )
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
      // export by name
      if (options.themeName && (await getTokens())) {
        verboseMessage(
          `Exporting theme "${
            options.themeName
          }" from realm "${state.getRealm()}"...`
        );
        exportThemeByName(
          options.themeName,
          options.file,
          options.metadata,
          options.sort
        );
      }
      // export by id
      else if (options.themeId && (await getTokens())) {
        verboseMessage(
          `Exporting theme "${
            options.themeId
          }" from realm "${state.getRealm()}"...`
        );
        exportThemeById(
          options.themeId,
          options.file,
          options.metadata,
          options.sort
        );
      }
      // --all -a
      else if (options.all && (await getTokens())) {
        verboseMessage('Exporting all themes to a single file...');
        exportThemesToFile(options.file, options.metadata, options.sort);
      }
      // --all-separate -A
      else if (options.allSeparate && (await getTokens())) {
        verboseMessage('Exporting all themes to separate files...');
        exportThemesToFiles(options.metadata, options.sort);
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
    }
    // end command logic inside action handler
  );

program.parse();
