import { FrodoCommand } from '../FrodoCommand';
import { Option } from 'commander';
import { frodo } from '@rockcarver/frodo-lib';
import {
  exportServicesToFile,
  exportServicesToFiles,
  exportServiceToFile,
} from '../../ops/ServiceOps.js';
import { printMessage, verboseMessage } from '../../utils/Console.js';

const { getTokens } = frodo.login;

const program = new FrodoCommand('frodo service export');

interface ServiceExportOptions {
  file?: string;
  all?: boolean;
  serviceId?: string;
  allSeparate?: boolean;
  type?: string;
  insecure?: boolean;
  verbose?: boolean;
  debug?: boolean;
  curlirize?: boolean;
  global?: boolean;
  metadata?: boolean;
  metadataFile?: string;
}

program
  .description('Export AM services.')
  .addOption(
    new Option(
      '-i, --service-id <service-id>',
      'Service id. If specified, -a and -A are ignored.'
    )
  )
  .addOption(new Option('-f, --file <file>', 'Name of the export file.'))
  .addOption(new Option('-a, --all', 'Export all services to a single file.'))
  .addOption(
    new Option(
      '-A, --all-separate',
      'Export all services to separate files (*.service.json) in the current directory. Ignored with -a.'
    )
  )
  .addOption(new Option('-g, --global', 'Export global services.'))
  .addOption(
    new Option(
      '--no-metadata',
      'Does not include metadata in the export file.'
    )
  )
  .addOption(
    new Option(
      '--metadata-file [metadataFile]',
      'Name of the file to write the metadata to.'
    )
  )
  .action(
    async (
      host: string,
      realm: string,
      user: string,
      password: string,
      options: ServiceExportOptions,
      command
    ) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      const globalConfig = options.global ?? false;

      // export by name
      if (options.serviceId && (await getTokens())) {
        verboseMessage('Exporting service...');
        await exportServiceToFile(
          options.serviceId,
          options.file,
          globalConfig,
          options.metadata,
          options.metadataFile
        );
      }
      // -a / --all
      else if (options.all && (await getTokens())) {
        verboseMessage('Exporting all services to a single file...');
        await exportServicesToFile(options.file, globalConfig, options.metadata, options.metadataFile);
      }
      // -A / --all-separate
      else if (options.allSeparate && (await getTokens())) {
        verboseMessage('Exporting all services to separate files...');
        await exportServicesToFiles(globalConfig, options.metadata, options.metadataFile);
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
