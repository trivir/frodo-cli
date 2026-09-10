import { frodo } from '@rockcarver/frodo-lib';
import { InvalidArgumentError, Option } from 'commander';

import { configManagerImportMetadata } from '../../../configManagerOps/FrConfigMetadataOps';
import { getTokens } from '../../../ops/AuthenticateOps';
import { verboseMessage } from '../../../utils/Console';
import { FrodoCommand, ObjectOption } from '../../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY, FORGEOPS_DEPLOYMENT_TYPE_KEY } =
  frodo.utils.constants;

const deploymentTypes = [
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
];

export default function setup(argv: string[] = process.argv.slice(2)) {
  const program = new FrodoCommand(
    'frodo config-manager push config-metadata',
    [],
    deploymentTypes
  );

  const metadataOption = new ObjectOption(
    '--metadata <metadata>',
    'Configuration metadata fields using dot notation.'
  )
    .argParser(() => {
      throw new InvalidArgumentError(
        'Use dot notation, for example --metadata.versionInfo.version 1.0'
      );
    })
    .makeOptionMandatory();

  program.addOption(metadataOption);
  const registeredFlags = new Set<string>();

  for (const argument of argv) {
    if (argument === '---') break;
    const flag = argument.split('=', 1)[0];
    if (!metadataOption.matches(flag) || registeredFlags.has(flag)) {
      continue;
    }
    registeredFlags.add(flag);

    program.addOption(
      new Option(`${flag} <value>`).hideHelp().argParser((value: string) => {
        const metadata = program.getOptionValue('metadata') ?? {};

        try {
          metadataOption.setValue(metadata, flag, value);
        } catch (error) {
          throw new InvalidArgumentError((error as Error).message);
        }
        program.setOptionValueWithSource('metadata', metadata, 'cli');
        return value;
      })
    );
  }
  program
    .description('Import metadata.')
    .action(async (host, realm, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(
        host,
        realm,
        user,
        password,
        options,
        command
      );

      const getTokensIsSuccessful = await getTokens(
        false,
        true,
        deploymentTypes
      );
      if (!getTokensIsSuccessful) process.exit(1);
      verboseMessage('Importing metadata.');
      const outcome = await configManagerImportMetadata(options.metadata);
      if (!outcome) process.exitCode = 1;
    });

  return program;
}
