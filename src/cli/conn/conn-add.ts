import { frodo, state } from '@rockcarver/frodo-lib';
import { Option } from 'commander';

import * as s from '../../help/SampleData';
import { getTokens } from '../../ops/AuthenticateOps';
import { addExistingServiceAccount } from '../../ops/ConnectionProfileOps.js';
import { provisionCreds } from '../../ops/LogOps';
import c from '../../utils/ColorTheme';
import { printError, printMessage, verboseMessage } from '../../utils/Console';
import { FrodoCommand } from '../FrodoCommand';

const { CLOUD_DEPLOYMENT_TYPE_KEY } = frodo.utils.constants;
const { isServiceAccountsFeatureAvailable } = frodo.cloud.serviceAccount;
const { addNewServiceAccount, saveConnectionProfile } = frodo.conn;

export default function setup() {
  const program = new FrodoCommand('frodo conn add', ['realm']);

  program
    .alias('save')
    .description('Create new connection profiles.')
    .addOption(new Option('--no-sa', 'Do not create and add service account.'))
    .addOption(
      new Option(
        '--log-api-key [key]',
        'Log API key. If specified, must also include --log-api-secret. Ignored with --no-log-api.'
      )
    )
    .addOption(
      new Option(
        '--log-api-secret [secret]',
        'Log API secret. If specified, must also include --log-api-key. Ignored with --no-log-api.'
      )
    )
    .addOption(
      new Option(
        '--no-log-api',
        'Do not create and add log API key and secret.'
      )
    )
    .addOption(new Option('--no-validate', 'Do not validate connection.'))
    .addOption(
      new Option(
        '--authentication-service [service]',
        'Name of the authentication service/tree to use.'
      )
    )
    .addOption(
      new Option(
        '--authentication-header-overrides [headers]',
        `Map of headers: '{"host":"am.example.com:8081"}'. These headers are sent with all requests and can be used to override default behavior, for example to set a custom host header for Proxy Connect-protected PingOne Advanced Identity Cloud environments.`
      )
    )
    .addOption(
      new Option(
        '--configuration-header-overrides [headers]',
        `Map of headers: '{"X-Configuration-Type":"mutable"}'. These headers are sent with all configuration requests and can be used to override default behavior, for example to set a custom configuration header for mutable PingOne Advanced Identity Cloud environments.`
      )
    )
    .addOption(
      new Option(
        '--name <name>',
        'Name for this connection profile. Must be unique.'
      ).makeOptionMandatory()
    )
    .addHelpText(
      'after',
      `Usage Examples:\n` +
        `  Create a connection profile with a new log API key and secret and a new service account:\n` +
        c.command(
          `  $ frodo conn add --name ${s.name} ${s.amBaseUrl} ${s.username} '${s.password}'\n`
        ) +
        `  Create a connection profile using Amster private key credentials (PingAM classic deployments only):\n` +
        c.command(
          `  $ frodo conn add --name ${s.name} --private-key ${s.amsterPrivateKey} ${s.amClassicBaseUrl}\n`
        ) +
        `  Save a new connection profile using an existing service account:\n` +
        c.command(
          `  $ frodo conn add --name ${s.name} --sa-id ${s.saId} --sa-jwk-file ${s.saJwkFile} ${s.amBaseUrl}\n`
        ) +
        `  Save a connection profile for a Proxy Connect-protected PingOne Advanced Identity Cloud environment:\n` +
        c.command(
          `  $ frodo conn add --name ${s.name} --authentication-header-overrides '{"MY-SECRET-HEADER": "proxyconnect secret header value"}' ${s.amBaseUrl} ${s.username} '${s.password}'\n`
        ) +
        `  Save a connection profile for a mutable PingOne Advanced Identity Cloud environment:\n` +
        c.command(
          `  $ frodo conn add --name ${s.name} --configuration-header-overrides '{"X-Configuration-Type": "mutable"}' ${s.amBaseUrl} ${s.username} '${s.password}'\n`
        ) +
        `\nTo update an existing connection profile, use ${c.command('frodo conn edit')} instead.\n`
    )
    .action(
      // implement command logic inside action handler
      async (host, user, password, options, command) => {
        command.handleDefaultArgsAndOpts(
          host,
          user,
          password,
          options,
          command
        );

        // set the right URL under the hood
        if (!state.getHost().endsWith('/am')) {
          host += '/am';
          state.setHost(host);
        }

        state.setName(options.name);
        state.setLogApiKey(options.logApiKey);
        state.setLogApiSecret(options.logApiSecret);
        if (options.authenticationService) {
          state.setAuthenticationService(options.authenticationService);
        }
        if (options.authenticationHeaderOverrides) {
          state.setAuthenticationHeaderOverrides(
            JSON.parse(options.authenticationHeaderOverrides)
          );
        }
        if (options.configurationHeaderOverrides) {
          state.setConfigurationHeaderOverrides(
            JSON.parse(options.configurationHeaderOverrides)
          );
        }
        const needAmsterLogin = !!options.privateKey;
        const needSa =
          options.sa &&
          !state.getServiceAccountId() &&
          !state.getServiceAccountJwk();
        const needLogApiKey =
          options.logApi &&
          !state.getLogApiKey() &&
          !state.getLogApiSecret() &&
          needSa;
        const forceLoginAsUser = !needAmsterLogin && (needSa || needLogApiKey);
        if (
          (options.validate && (await getTokens(forceLoginAsUser))) ||
          !options.validate
        ) {
          verboseMessage(
            `Saving connection profile '${state.getName()}' for tenant ${state.getHost()}...`
          );
          // if cloud deployment add service account
          if (
            options.validate &&
            state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY &&
            options.sa &&
            (await isServiceAccountsFeatureAvailable())
          ) {
            // validate and add existing service account
            if (options.saId && options.saJwkFile) {
              verboseMessage(`Validating and adding service account...`);
              if (
                await addExistingServiceAccount(
                  options.saId,
                  options.saJwkFile,
                  options.validate
                )
              ) {
                printMessage(
                  `Validated and added service account with id ${options.saId} to profile.`
                );
              }
            }
            // add new service account if none already exists in the profile
            else if (!state.getServiceAccountId()) {
              try {
                verboseMessage(`Creating service account...`);
                const sa = await addNewServiceAccount();
                printMessage(
                  `Created and added service account ${sa.name} with id ${sa._id} to profile.`,
                  'info'
                );
              } catch (error) {
                printError(error);
                process.exitCode = 1;
              }
            }
          }
          // add existing service account without validation
          else if (
            !options.validate &&
            options.saId &&
            options.saJwkFile &&
            options.sa
          ) {
            addExistingServiceAccount(
              options.saId,
              options.saJwkFile,
              options.validate
            );
          }
          // if cloud deployment add log api key and secret
          verboseMessage(options);
          verboseMessage(state);
          if (
            options.validate &&
            state.getDeploymentType() === CLOUD_DEPLOYMENT_TYPE_KEY &&
            needLogApiKey
          ) {
            // validate and add existing log api key and secret
            if (options.logApiKey && options.logApiSecret) {
              verboseMessage(`Validating and adding log api key and secret...`);
              if (
                await addExistingServiceAccount(
                  options.logApiKey,
                  options.logApiSecret,
                  options.validate
                )
              ) {
                printMessage(
                  `Added log API key ${options.logApiKey} to profile.`
                );
              }
            }
            // add new log api key and secret if none already exists in the profile
            else if (!state.getLogApiKey()) {
              try {
                const creds = await provisionCreds();
                state.setLogApiKey(creds.api_key_id as string);
                state.setLogApiSecret(creds.api_key_secret as string);
                printMessage(
                  `Created log API key ${creds.api_key_id} and secret.`
                );
              } catch (error) {
                printMessage(error.response?.data, 'error');
                printMessage(
                  `Error creating log API key and secret: ${error.response?.data?.message}`,
                  'error'
                );
                process.exitCode = 1;
              }
            }
          }
          try {
            await saveConnectionProfile(state.getName(), host, true);
            printMessage(
              `Saved connection profile '${state.getName()}' (${state.getHost()})`
            );
          } catch (error) {
            printError(error);
            process.exitCode = 1;
          }
        } else {
          process.exitCode = 1;
        }
      }
      // end command logic inside action handler
    );

  return program;
}
