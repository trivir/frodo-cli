import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';
import fs from 'fs';

import { printError, printMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;
const { isServiceAccountsFeatureAvailable } = frodo.cloud.serviceAccount;
const { loadConnectionProfileByHost, updateConnectionProfile } = frodo.conn;

export default function setup() {
  const program = new FrodoCommand('frodo conn update', ['realm']);

  program
    .description('Update existing connection profiles.')
    .addOption(
      new Option(
        '-s, --skip-prompts',
        'Add credentials without interactive prompts.'
      )
    )

    .addOption(new Option('--username [username]').hideHelp())
    .addOption(new Option('--password [password]').hideHelp())
    .addOption(new Option('--log-api-key [key]').hideHelp())
    .addOption(new Option('--log-api-secret [secret]').hideHelp())

    .addOption(
      new Option(
        '--service-account',
        'Add a service account. This will prompt for the ID and corresponding JWK file.'
      )
    )
    .addOption(
      new Option(
        '--user-account',
        'Add a user account. This will prompt for the username and corresponding credentials.'
      )
    )
    .addOption(
      new Option(
        '--log-api',
        'Add a log API key. This will prompt for the key ID and corresponding secret.'
      )
    )

    .on('--help', () => {
      if (
        process.argv.includes('-s') ||
        process.argv.includes('--skip-prompts')
      ) {
        printMessage(`
          Skip-Prompts Mode Options (required when --skip-prompts is set):
            --sa-id [id]                    Service account ID
            --sa-jwk-file [file]            Path to service account JWK file
            --username [username]           User account username
            --password [password]           User account password
            --log-api-key [key]             Log API Key
            --log-api-secret [secret]       Log API secret
      `);
      }
    })

    .action(async (host, user, password, options, command) => {
      command.handleDefaultArgsAndOpts(host, user, password, options, command);

      try {
        await loadConnectionProfileByHost(host);

        const interactive = !options.skipPrompts;
        const updated = {
          serviceAccount: false,
          userAccount: false,
          logApi: false,
        };

        if (!interactive) {
          if (
            options.saId &&
            state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY &&
            isServiceAccountsFeatureAvailable
          ) {
            if (options.saJwkFile) {
              const jwk = JSON.parse(
                fs.readFileSync(options.saJwkFile).toString()
              );
              state.setServiceAccountId(options.saId);
              state.setServiceAccountJwk(jwk);
              updated.serviceAccount = true;
            } else {
              printMessage('JWK required to add service account.', 'error');
            }
          }

          if (options.username) {
            if (options.password) {
              state.setUsername(options.username);
              state.setPassword(options.password);
              updated.userAccount = true;
            } else {
              printMessage('Password required to add a user account.', 'error');
            }
          }

          if (
            options.logApiKey &&
            state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY
          ) {
            if (options.logApiSecret) {
              state.setLogApiKey(options.logApiKey);
              state.setLogApiSecret(options.logApiSecret);
              updated.logApi = true;
            } else {
              printMessage('Secret required to add a log API key.', 'error');
            }
          }
        } else {
          updated.serviceAccount = !!(
            options.serviceAccount && isServiceAccountsFeatureAvailable
          );
          updated.userAccount = !!options.userAccount;
          updated.logApi = !!options.logApi;
        }

        if (updated.serviceAccount || updated.userAccount || updated.logApi) {
          await updateConnectionProfile(
            updated.serviceAccount,
            updated.userAccount,
            updated.logApi,
            interactive
          );
        } else {
          printMessage('No changes made to connection profile.', 'warn');
        }
      } catch (error) {
        printError(error);
        process.exitCode = 1;
      }
    });

  return program;
}
