import { Option } from 'commander';

import { getTokens } from '../../ops/AuthenticateOps';
import { deleteService, deleteServices } from '../../ops/ServiceOps.js';
import { FrodoCommand } from '../FrodoCommand';

const program = new FrodoCommand('frodo service delete');

interface ServiceDeleteOptions {
  id?: string;
  type?: string;
  insecure?: boolean;
  verbose?: boolean;
  debug?: boolean;
  curlirize?: boolean;
  all?: boolean;
  global?: boolean;
}

program
  .description('Delete AM services.')
  .addOption(new Option('-i, --id <id>', 'Id of Service to be deleted.'))
  .addOption(new Option('-a, --all', 'Delete all services. Ignored with -i.'))
  .addOption(new Option('-g, --global', 'Delete global services.'))
  .action(
    async (
      host: string,
      realm: string,
      user: string,
      password: string,
      options: ServiceDeleteOptions,
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

      if (options.id && (await getTokens())) {
        await deleteService(options.id, globalConfig);
      } else if (options.all && (await getTokens())) {
        await deleteServices(globalConfig);
      } else {
        program.help();
        process.exitCode = 1;
      }
    }
  );

program.parse();
