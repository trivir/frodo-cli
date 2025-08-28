import { frodo, FrodoError, state } from '@rockcarver/frodo-lib';
import { Argument, Command, Help, Option } from 'commander';
import fs from 'fs';

import { getTokens } from '../ops/AuthenticateOps.js';
import {
  cleanupProgressIndicators,
  createProgressIndicator,
  curlirizeMessage,
  debugMessage,
  printError,
  printMessage,
  stopProgressIndicator,
  updateProgressIndicator,
  verboseMessage,
} from '../utils/Console.js';
import {
  Differ,
  DiffOptions,
  Exporter,
  readJsonFromFile,
} from '../utils/Diff.js';

const { DEFAULT_REALM_KEY, DEPLOYMENT_TYPES } = frodo.utils.constants;

const hostArgument = new Argument(
  '[host]',
  'AM base URL, e.g.: https://cdk.iam.example.com/am. To use a connection profile, just specify a unique substring.'
);

const realmArgument = new Argument(
  '[realm]',
  "Realm. Specify realm as '/' for the root realm or 'realm' or '/parent/child' otherwise."
).default(
  // must check for FRODO_REALM env variable here because otherwise cli will overwrite realm with default value
  process.env.FRODO_REALM || DEFAULT_REALM_KEY,
  '"alpha" for Identity Cloud tenants, "/" otherwise.'
);

const usernameArgument = new Argument(
  '[username]',
  'Username to login with. Must be an admin user with appropriate rights to manage authentication journeys/trees.'
);

const passwordArgument = new Argument('[password]', 'Password.');

const idmHostOption = new Option(
  '--idm-host <idm-host>',
  'IDM base URL, e.g.: https://cdk.idm.example.com/myidm. Use only if your IDM installation resides in a different domain and/or if the base path differs from the default "/openidm".'
);

const loginClientId = new Option(
  '--login-client-id <client-id>',
  'Specify a custom OAuth2 client id to use a your own oauth2 client for IDM API calls in deployments of type "cloud" or "forgeops". Your custom client must be configured as a public client and allow the authorization code grant using the "openid fr:idm:*" scope. Use the "--redirect-uri" parameter if you have configured a custom redirect uri (default: "<host>/platform/appAuthHelperRedirect.html").'
);

const loginRedirectUri = new Option(
  '--login-redirect-uri <redirect-uri>',
  'Specify a custom redirect URI to use with your custom OAuth2 client (efault: "<host>/platform/appAuthHelperRedirect.html").'
);

const serviceAccountIdOption = new Option(
  '--sa-id <sa-id>',
  'Service account id.'
);

const serviceAccountJwkFileOption = new Option(
  '--sa-jwk-file <file>',
  'File containing the JSON Web Key (JWK) associated with the the service account.'
);

const deploymentOption = new Option(
  '-m, --type <type>',
  'Override auto-detected deployment type. Valid values for type: \n\
classic:  A classic Access Management-only deployment with custom layout and configuration. \n\
cloud:    A ForgeRock Identity Cloud environment. \n\
forgeops: A ForgeOps CDK or CDM deployment. \n\
The detected or provided deployment type controls certain behavior like obtaining an Identity \
Management admin token or not and whether to export/import referenced email templates or how \
to walk through the tenant admin login flow of Identity Cloud and handle MFA'
).choices(DEPLOYMENT_TYPES);

const directoryOption = new Option(
  '-D, --directory <directory>',
  'Set the working directory.'
).default(undefined, 'undefined');

const insecureOption = new Option(
  '-k, --insecure',
  'Allow insecure connections when using SSL/TLS. Has no effect when using a network proxy for https (HTTPS_PROXY=http://<host>:<port>), in that case the proxy must provide this capability.'
).default(false, "Don't allow insecure connections");

const verboseOption = new Option(
  '--verbose',
  'Verbose output during command execution. If specified, may or may not produce additional output.'
);

const debugOption = new Option(
  '--debug',
  'Debug output during command execution. If specified, may or may not produce additional output helpful for troubleshooting.'
);

const curlirizeOption = new Option(
  '--curlirize',
  'Output all network calls in curl format.'
);

const noCacheOption = new Option(
  '--no-cache',
  'Disable token cache for this operation.'
);

const flushCacheOption = new Option('--flush-cache', 'Flush token cache.');

const defaultArgs = [
  hostArgument,
  realmArgument,
  usernameArgument,
  passwordArgument,
];

const defaultOpts = [
  idmHostOption,
  loginClientId,
  loginRedirectUri,
  serviceAccountIdOption,
  serviceAccountJwkFileOption,
  deploymentOption,
  directoryOption,
  insecureOption,
  verboseOption,
  debugOption,
  curlirizeOption,
  noCacheOption,
  flushCacheOption,
];

const stateMap = {
  [hostArgument.name()]: (host: string) => state.setHost(host),
  [realmArgument.name()]: (realm: string) => state.setRealm(realm),
  [usernameArgument.name()]: (username: string) => state.setUsername(username),
  [passwordArgument.name()]: (password: string) => state.setPassword(password),
  [idmHostOption.attributeName()]: (idmHost: string) =>
    state.setIdmHost(idmHost),
  [loginClientId.attributeName()]: (clientId: string) =>
    state.setAdminClientId(clientId),
  [loginRedirectUri.attributeName()]: (redirectUri: string) =>
    state.setAdminClientRedirectUri(redirectUri),
  [serviceAccountIdOption.attributeName()]: (saId: string) =>
    state.setServiceAccountId(saId),
  [serviceAccountJwkFileOption.attributeName()]: (file: string) => {
    try {
      const data = fs.readFileSync(file);
      const jwk = JSON.parse(data.toString());
      state.setServiceAccountJwk(jwk);
    } catch (error) {
      printMessage(
        `Error parsing JWK from file ${file}: ${error.message}`,
        'error'
      );
    }
  },
  [deploymentOption.attributeName()]: (type: string) =>
    state.setDeploymentType(type),
  [directoryOption.attributeName()]: (directory: string) =>
    state.setDirectory(directory.replaceAll('\\', '/').replaceAll('C:', '')),
  [insecureOption.attributeName()]: (insecure: boolean) =>
    state.setAllowInsecureConnection(insecure),
  [verboseOption.attributeName()]: (verbose: boolean) =>
    state.setVerbose(verbose),
  [debugOption.attributeName()]: (debug: boolean) => state.setDebug(debug),
  [curlirizeOption.attributeName()]: (curlirize: boolean) =>
    state.setCurlirize(curlirize),
  [noCacheOption.attributeName()]: (cache: boolean) =>
    state.setUseTokenCache(cache),
  [flushCacheOption.attributeName()]: (flush: boolean) => {
    if (flush) frodo.cache.flush();
  },
};

/**
 * Command with default options
 */
export class FrodoStubCommand extends Command {
  /**
   * Creates a new FrodoCommand instance
   * @param name Name of the command
   */
  constructor(name: string) {
    super(name);

    if (!process.listenerCount('unhandledRejection')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      process.on('unhandledRejection', (error: any) => {
        printError(
          new FrodoError(
            `Please report this unhandled error here: https://github.com/rockcarver/frodo-cli/issues`,
            error
          )
        );
        process.exitCode = 1;
      });
    }

    // other default settings
    this.helpOption('-h, --help', 'Help');
    this.showHelpAfterError();
    this.configureHelp({
      sortSubcommands: true,
      sortOptions: true,
    });

    // register default handlers
    state.setPrintHandler(printMessage);
    state.setVerboseHandler(verboseMessage);
    state.setDebugHandler(debugMessage);
    state.setCurlirizeHandler(curlirizeMessage);
    state.setCreateProgressHandler(createProgressIndicator);
    state.setUpdateProgressHandler(updateProgressIndicator);
    state.setStopProgressHandler(stopProgressIndicator);

    // shutdown handlers
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.hook('postAction', (thisCommand, actionCommand) => {
      debugMessage(
        `FrodoCommand: running postAction hook: this command: ${thisCommand.name()}, action command: ${actionCommand.name()}`
      );
      cleanupProgressIndicators();
    });
  }

  createHelp() {
    return Object.assign(new FrodoStubHelp(), this.configureHelp());
  }
}

class FrodoStubHelp extends Help {
  subcommandTerm(cmd) {
    return cmd._name + (cmd._aliases[0] ? '|' + cmd._aliases[0] : '');
  }
}

/**
 * Command with default options
 */
export class FrodoCommand extends FrodoStubCommand {
  types: string[];

  /**
   * Creates a new FrodoCommand instance
   * @param name Name of the command
   * @param omits Array of default argument names and default option names that should not be added to this command
   * @param types Array of deployment types this command supports
   */
  constructor(
    name: string,
    omits: string[] = [],
    types: string[] = DEPLOYMENT_TYPES
  ) {
    super(name);

    this.types = types;

    // register default arguments
    for (const arg of defaultArgs) {
      if (!omits.includes(arg.name())) this.addArgument(arg);
    }

    // register default options
    for (const opt of defaultOpts) {
      if (!omits.includes(opt.name())) this.addOption(opt);
    }

    // additional help
    this.addHelpText(
      'after',
      `\nEnvironment Variables:\n` +
        `  FRODO_HOST: AM base URL. Overridden by 'host' argument.\n` +
        `  FRODO_IDM_HOST: IDM base URL. Overridden by '--idm-host' option.\n` +
        `  FRODO_REALM: Realm. Overridden by 'realm' argument.\n` +
        `  FRODO_USERNAME: Username. Overridden by 'username' argument.\n` +
        `  FRODO_PASSWORD: Password. Overridden by 'password' argument.\n` +
        `  FRODO_LOGIN_CLIENT_ID: OAuth2 client id for IDM API calls. Overridden by '--login-client-id' option.\n` +
        `  FRODO_LOGIN_REDIRECT_URI: Redirect Uri for custom OAuth2 client id. Overridden by '--login-redirect-uri' option.\n` +
        `  FRODO_SA_ID: Service account uuid. Overridden by '--sa-id' option.\n` +
        `  FRODO_SA_JWK: Service account JWK. Overridden by '--sa-jwk-file' option but takes the actual JWK as a value, not a file name.\n` +
        `  FRODO_NO_CACHE: Disable token cache. Same as '--no-cache' option.\n` +
        `  FRODO_TOKEN_CACHE_PATH: Use this token cache file instead of '~/.frodo/TokenCache.json'.\n` +
        ('frodo conn save' === this.name()
          ? `  FRODO_LOG_KEY: Log API key. Overridden by '--log-api-key' option.\n` +
            `  FRODO_LOG_SECRET: Log API secret. Overridden by '--log-api-secret' option.\n`
          : ``) +
        (this.name().startsWith('frodo log')
          ? `  FRODO_LOG_KEY: Log API key. Overridden by 'username' argument.\n` +
            `  FRODO_LOG_SECRET: Log API secret. Overridden by 'password' argument.\n`
          : ``) +
        `  FRODO_CONNECTION_PROFILES_PATH: Use this connection profiles file instead of '~/.frodo/Connections.json'.\n` +
        `  FRODO_AUTHENTICATION_SERVICE: Name of a login journey to use.\n` +
        `  FRODO_DEBUG: Set to any value to enable debug output. Same as '--debug'.\n` +
        `  FRODO_MASTER_KEY_PATH: Use this master key file instead of '~/.frodo/masterkey.key' file.\n` +
        `  FRODO_MASTER_KEY: Use this master key instead of what's in '~/.frodo/masterkey.key'. Takes precedence over FRODO_MASTER_KEY_PATH.\n`
    );
  }

  /**
   *
   * @param args
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDefaultArgsAndOpts(...args: any) {
    const command = args.pop();
    const options = args.pop();

    // handle arguments first
    for (const [i, v] of command.args.entries()) {
      if (!command._args[i]) {
        printMessage(
          `${command.args.length} arguments supplied but command only supports ${command._args.length}.`,
          'warn'
        );
        break;
      }
      const arg = command._args[i].name();
      // handle only default arguments
      if (Object.keys(stateMap).includes(arg)) {
        debugMessage(
          `FrodoCommand.handleDefaultArgsAndOpts: Handling default argument '${arg}'.`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler: any = stateMap[arg];
        handler(v);
      } else {
        debugMessage(
          `FrodoCommand.handleDefaultArgsAndOpts: Ignoring non-default argument '${arg}'.`
        );
      }
    }

    // handle options
    for (const [k, v] of Object.entries(options)) {
      // handle only default options
      if (Object.keys(stateMap).includes(k)) {
        debugMessage(
          `FrodoCommand.handleDefaultArgsAndOpts: Handling default option '${k}'.`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler: any = stateMap[k];
        handler(v);
      } else {
        debugMessage(
          `FrodoCommand.handleDefaultArgsAndOpts: Ignoring non-default option '${k}'.`
        );
      }
    }

    // fail fast if an incompatible deployment type option (-m or --type) was provided
    if (
      state.getDeploymentType() &&
      !this.types.includes(state.getDeploymentType())
    ) {
      throw new FrodoError(
        `Command does not support deployment type '${state.getDeploymentType()}'`
      );
    }
  }
}

export class DiffCommand<T, V> extends FrodoCommand {
  /**
   * Creates a new DiffCommand instance
   * @param name Name of the command
   * @param description Description of the command
   * @param namesOption Add options for exporting cloud config by name
   * @param exporter Function to export a config entity by id or name
   * @param differ Function to perform the diff between two exported config entities
   * @param omits Array of default argument names and default option names that should not be added to this command
   * @param types Array of deployment types this command supports
   */
  constructor(
    name: string,
    description: string,
    namesOption: boolean = false,
    exporter: Exporter<T, V> = () => ({}) as Promise<T>,
    differ: Differ<T, V> = () => [],
    omits: string[] = [],
    types: string[] = DEPLOYMENT_TYPES
  ) {
    super(name, omits, types);
    this.description(description);
    this.option('-of, --old-file <path>', 'old local config file');
    this.option('-nf, --new-file <path>', 'new local config file');
    this.option('-oi, --old-id <id>', 'old cloud config by ID');
    this.option('-ni, --new-id <id>', 'new cloud config by ID');
    if (namesOption) {
      this.option('-on, --old-name <name>', 'old cloud config by name');
      this.option('-nn, --new-name <name>', 'new cloud config by name');
    }
    this.action(
      async (
        host,
        realm,
        user,
        password,
        options: DiffOptions & V,
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
        const oldName = namesOption && options.oldName;
        const newName = namesOption && options.newName;
        const oldOptionsCount = [
          options.oldFile,
          options.oldId,
          oldName,
        ].filter((o) => o).length;
        const newOptionsCount = [
          options.newFile,
          options.newId,
          newName,
        ].filter((o) => o).length;
        if (
          oldOptionsCount !== 1 ||
          newOptionsCount !== 1 ||
          ((options.oldId || options.newId || oldName || newName) &&
            !(await getTokens()))
        ) {
          printMessage(
            'Unrecognized combination of options or no options...',
            'error'
          );
          this.outputHelp();
          process.exit(1);
        }
        let oldExport: T;
        let newExport: T;
        if (options.oldFile) oldExport = readJsonFromFile<T>(options.oldFile);
        if (options.oldId)
          oldExport = await exporter(options.oldId, undefined, options);
        if (oldName)
          oldExport = await exporter(undefined, options.oldName, options);
        if (options.newFile) newExport = readJsonFromFile<T>(options.newFile);
        if (options.newId)
          newExport = await exporter(options.newId, undefined, options);
        if (newName)
          newExport = await exporter(undefined, options.newName, options);
        const diffs = differ(oldExport, newExport, options);
        printMessage(diffs.join('\n'), 'data');
      }
    );
  }
}
