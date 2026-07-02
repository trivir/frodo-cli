import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import * as s from '../../help/SampleData';
import fs from 'fs';
import { printError, printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;
const { isServiceAccountsFeatureAvailable } = frodo.cloud.serviceAccount;
const { saveNewConnectionProfile } = frodo.conn;

export default function setup() {
  const program = new FrodoCommand('frodo conn save', ['realm']);

  program
    .alias('add')
    .description('Save connection profiles.')

    .addOption(
      new Option(
        '-s, --skip-prompts',
        'Provide all credentials via flags; skip interactive prompts.'
      )
    )
    .addOption(
      new Option(
        '--service-account',
        'Save a connection profile authenticated with a service account.'
      )
    )
    .addOption(
      new Option(
        '--user-account',
        'Save a connection profile authenticated with a user account.'
      )
    )

    .addOption(new Option('--sa-id <id>', 'Service account ID.').hideHelp())
    .addOption(
      new Option(
        '--sa-jwk-file <file>',
        'Path to the service account JWK file.'
      ).hideHelp()
    )

    .addOption(
      new Option('--username <username>', 'User account username.').hideHelp()
    )
    .addOption(
      new Option('--password <password>', 'User account password.').hideHelp()
    )

    .addOption(
      new Option(
        '--log-api',
        'Add a log API key and secret to the connection profile. ' +
          'If omitted the profile is saved without log API credentials.'
      )
    )
    .addOption(new Option('--log-api-key <key>', 'Log API key ID.').hideHelp())
    .addOption(
      new Option('--log-api-secret <secret>', 'Log API secret.').hideHelp()
    )

    .addOption(
      new Option(
        '--no-validate',
        'Save the profile without validating the connection.'
      )
    )
    .requiredOption(
      '--alias <name>',
      'Alias name for this connection profile. Required.'
    )
    .addOption(
      new Option(
        '--authentication-service [service]',
        'Name of the authentication service/tree to use.'
      )
    )
    .addOption(
      new Option(
        '--authentication-header-overrides [headers]',
        `Map of headers: '{"host":"am.example.com:8081"}'. Sent with all requests.`
      )
    )
    .addOption(
      new Option(
        '--configuration-header-overrides [headers]',
        `Map of headers: '{"X-Configuration-Type":"mutable"}'. Sent with all configuration requests.`
      )
    )

    .on('--help', () => {
      if (
        process.argv.includes('-s') ||
        process.argv.includes('--skip-prompts')
      ) {
        printMessage(`
  Skip-Prompts Mode Options:

    Service account path:
      --sa-id <id>              Service account ID (required)
      --sa-jwk-file <file>      Path to service account JWK file (required)

    User account:
      --username <username>     User account username (required)
      --password <password>     User account password (required)

    Log API (optional):
      --log-api                 Include log API credentials
      --log-api-key <key>       Log API key ID (required when --log-api is set)
      --log-api-secret <secret> Log API secret  (required when --log-api is set)
        `);
      }
    })

    .addHelpText(
      'after',
      `\nUsage Examples:\n` +
        `  Save a connection profile using a service account (interactive):\n` +
        `  $ frodo conn save ${s.amBaseUrl} --service-account\n`['brightCyan'] +
        `  Save a connection profile using a service account (non-interactive):\n` +
        `  $ frodo conn save ${s.amBaseUrl} --service-account -s --sa-id ${s.saId} --sa-jwk-file ${s.saJwkFile} --alias ${s.alias}\n`[
          'brightCyan'
        ] +
        `  Save a connection profile using a user account (interactive):\n` +
        `  $ frodo conn save ${s.amBaseUrl} --user-account --alias\n`[
          'brightCyan'
        ] +
        `  Save a connection profile using a user account (non-interactive):\n` +
        `  $ frodo conn save ${s.amBaseUrl} --user-account -s --username ${s.username} --password '${s.password}' --alias ${s.alias}\n`[
          'brightCyan'
        ] +
        `  Save a user account profile and provision a log API key (interactive):\n` +
        `  $ frodo conn save ${s.amBaseUrl} --user-account --log-api\n`[
          'brightCyan'
        ]
    )

    .action(async (host, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(host, user, password, options, command);

      if (!host) {
        printMessage(
          'Error: A host URL must be provided as the first argument.\n' +
            `  Example: frodo conn save https://example.com/am --service-account --alias ${s.alias}`,
          'error'
        );
        process.exitCode = 1;
        return;
      }

      if (
        options.saId &&
        options.saJwkFile &&
        isServiceAccountsFeatureAvailable &&
        state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY
      ) {
        options.serviceAccount = true;
        state.setServiceAccountId(options.saId);
        state.setServiceAccountJwk(
          JSON.parse(fs.readFileSync(options.saJwkFile).toString())
        );
      }

      if (options.username && options.password) {
        options.userAccount = true;
        state.setUsername(options.username);
        state.setPassword(options.password);
      }

      if (
        options.logApiKey &&
        options.logApiSecret &&
        state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY
      ) {
        options.logApi = true;
        state.setLogApiKey(options.logApi);
        state.setLogApiSecret(options.logApiSecret);
      }

      const interactive = !options.skipPrompts;

      if (options.serviceAccount && options.userAccount) {
        printMessage(
          'Error: service accounts and user accounts are mutually exclusive. Choose only one.',
          'error'
        );
        process.exitCode = 1;
        return;
      }

      if (!options.serviceAccount && !options.userAccount) {
        printMessage(
          'Error: You must specify either a service account or user account.',
          'error'
        );
        process.exitCode = 1;
        return;
      }

      try {
        await saveNewConnectionProfile(
          options.serviceAccount,
          options.userAccount,
          options.logApi,
          interactive
        );
        printMessage(`Saved connection profile ${host} [${options.alias}]`);
      } catch (error) {
        printError(error);
        process.exitCode = 1;
      }
    });

  return program;
}
