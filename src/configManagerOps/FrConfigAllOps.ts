import { frodo, state } from '@rockcarver/frodo-lib';

import { printError } from '../utils/Console';
import { configManagerExportAccessConfig } from './FrConfigAccessConfigOps';
import { configManagerExportAudit } from './FrConfigAuditOps';
import { configManagerExportAuthentication } from './FrConfigAuthenticationOps';
import { configManagerExportAuthzPolicySets } from './FrConfigAuthzPoliciesOps';
import { configManagerExportConnectorDefinitionsAll } from './FrConfigConnectorDefinitionsOps';
import { configManagerExportMappings } from './FrConfigConnectorMappingOps';
import { configManagerExportCookieDomains } from './FrConfigCookieDomainsOps';
import { configManagerExportCors } from './FrConfigCorsOps';
import { configManagerExportCsp } from './FrConfigCspOps';
import { configManagerExportCustomNodes } from './FrConfigCustomNodesOps';
import { configManagerExportEmailProviderConfiguration } from './FrConfigEmailProviderOps';
import { configManagerExportEmailTemplates } from './FrConfigEmailTemplatesOps';
import { configManagerExportEndpoints } from './FrConfigEndpointsOps';
import { configManagerExportInternalRoles } from './FrConfigInternalRolesOps';
import { configManagerExportJourneys } from './FrConfigJourneysOps';
import { configManagerExportKbaConfig } from './FrConfigKbaOps';
import { configManagerExportLocales } from './FrConfigLocalesOps';
import { configManagerExportManagedObjects } from './FrConfigManagedObjectsOps';
import { configManagerExportConfigAgents } from './FrConfigOauth2AgentOps';
import { configManagerExportOrgPrivileges } from './FrConfigOrgPrivilegesOps';
import { configManagerExportPasswordPolicy } from './FrConfigPasswordPolicyOps';
import { configManagerExportRaw } from './FrConfigRawOps';
import { configManagerExportRemoteServers } from './FrConfigRemoteServersOps';
import { configManagerExportSaml } from './FrConfigSamlOps';
import { configManagerExportSchedules } from './FrConfigSchedulesOps';
import { configManagerExportScripts } from './FrConfigScriptOps';
import { configManagerExportSecretMappings } from './FrConfigSecretMappingsOps';
import { configManagerExportSecrets } from './FrConfigSecretOps';
import { configManagerExportServiceObjectsFromFile } from './FrConfigServiceObjectsOps';
import { configManagerExportServices } from './FrConfigServiceOps';
import { configManagerExportTermsAndConditions } from './FrConfigTermsAndConditionsOps';
import { configManagerExportThemes } from './FrConfigThemeOps';
import { configManagerExportUiConfig } from './FrConfigUiConfigOps';
import { configManagerExportVariables } from './FrConfigVariableOps';

const {
  CLASSIC_DEPLOYMENT_TYPE_KEY,
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
} = frodo.utils.constants;

const deploymentMapAll = {
  [FORGEOPS_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerExportAccessConfig(),
    () => configManagerExportAudit(),
    (options) => configManagerExportAuthentication(options.realm),
    (options) =>
      configManagerExportAuthzPolicySets(
        `${options.configFolder}/authz-policies.json`
      ),
    (options) =>
      configManagerExportConfigAgents(
        `${options.configFolder}/oauth2-agents.json`
      ),
    () => configManagerExportConnectorDefinitionsAll(),
    () => configManagerExportCors(),
    () => configManagerExportCustomNodes(),
    () => configManagerExportEmailProviderConfiguration(),
    () => configManagerExportEmailTemplates(),
    () => configManagerExportEndpoints(),
    () => configManagerExportInternalRoles(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    () => configManagerExportKbaConfig(),
    () => configManagerExportLocales(),
    () => configManagerExportManagedObjects(),
    () => configManagerExportMappings(),
    () => configManagerExportOrgPrivileges(),
    (options) => configManagerExportPasswordPolicy(options.realm),
    (options) => configManagerExportRaw(`${options.configFolder}/raw.json`),
    () => configManagerExportRemoteServers(),
    (options) => configManagerExportSaml(`${options.configFolder}/saml.json`),
    () => configManagerExportSchedules(),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) =>
      configManagerExportServiceObjectsFromFile(
        `${options.configFolder}/service-objects.json`
      ),
    (options) => configManagerExportServices(options.realm),
    () => configManagerExportTermsAndConditions(),
    (options) => configManagerExportThemes(options.realm),
    () => configManagerExportUiConfig(),
  ],
  [CLOUD_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerExportAccessConfig(),
    () => configManagerExportAudit(),
    (options) => configManagerExportAuthentication(options.realm),
    (options) =>
      configManagerExportAuthzPolicySets(
        `${options.configFolder}/authz-policies.json`

      ),
    (options) =>
      configManagerExportConfigAgents(
        `${options.configFolder}/oauth2-agents.json`
      ),
    () => configManagerExportConnectorDefinitionsAll(),
    () => configManagerExportCookieDomains(),
    () => configManagerExportCors(),
    (options) => configManagerExportCsp(`${options.configFolder}/csp-overrides.json`),
    () => configManagerExportCustomNodes(),
    () => configManagerExportEmailProviderConfiguration(),
    () => configManagerExportEmailTemplates(),
    () => configManagerExportEndpoints(),
    () => configManagerExportInternalRoles(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    () => configManagerExportKbaConfig(),
    () => configManagerExportLocales(),
    () => configManagerExportManagedObjects(),
    () => configManagerExportMappings(),
    () => configManagerExportOrgPrivileges(),
    (options) => configManagerExportPasswordPolicy(options.realm),
    (options) => configManagerExportRaw(`${options.configFolder}/raw.json`),
    () => configManagerExportRemoteServers(),
    (options) => configManagerExportSaml(`${options.configFolder}/saml.json`),
    () => configManagerExportSchedules(),
    (options) => configManagerExportScripts(undefined, options.realm),
    () => configManagerExportSecrets(),
    (options) => configManagerExportSecretMappings(undefined, options.realm),
    (options) =>
      configManagerExportServiceObjectsFromFile(
        `${options.configFolder}/service-objects.json`
      ),
    () => configManagerExportServices(),
    //() => configManagerExportTelemetry(),
    () => configManagerExportTermsAndConditions(),
    (options) => configManagerExportThemes(options.realm),
    () => configManagerExportUiConfig(),
    () => configManagerExportVariables(),
  ],
  [CLASSIC_DEPLOYMENT_TYPE_KEY]: [
    (options) => configManagerExportAuthentication(options.realm),
    (options) =>
      configManagerExportAuthzPolicySets(
        `${options.configFolder}/authz-policies.json`
      ),
    (options) =>
      configManagerExportConfigAgents(
        `${options.configFolder}/oauth2-agents.json`
      ),
    () => configManagerExportCors(),
    () => configManagerExportCustomNodes(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    (options) => configManagerExportRaw(`${options.configFolder}/raw.json`),
    (options) => configManagerExportSaml(`${options.configFolder}/saml.json`),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) => configManagerExportServices(options.realm),
  ],
};

// const deploymentMapAllStatic = {
//   [FORGEOPS_DEPLOYMENT_TYPE_KEY]: [
//     configManagerExportAccessConfig,
//     configManagerExportAudit,
//     configManagerExportAuthentication,
//     configManagerExportAuthzPolicySets,
//     configManagerExportConnectorDefinitionsAll,
//     configManagerExportMappings,
//     configManagerExportCookieDomains,
//     configManagerExportCors,
//     configManagerExportEmailProviderConfiguration,
//     configManagerExportEmailTemplates,
//     configManagerExportEndpoints,
//     configManagerExportInternalRoles,
//     configManagerExportJourneys,
//     configManagerExportKbaConfig,
//     configManagerExportLocales,
//     configManagerExportManagedObjects,
//     configManagerExportConfigAgents,
//     configManagerExportOrgPrivileges,
//     configManagerExportPasswordPolicy,
//     configManagerExportRemoteServers,
//     configManagerExportSchedules,
//     configManagerExportSaml,
//     configManagerExportScripts,
//     configManagerExportSecrets,
//     configManagerExportSecretMappings,
//     configManagerExportServiceObjectsFromFile,
//     configManagerExportServices,
//     configManagerExportThemes,
//     configManagerExportTermsAndConditions,
//     configManagerExportUiConfig,
//     configManagerExportVariables,
//   ],
//   [CLOUD_DEPLOYMENT_TYPE_KEY]: [
//     configManagerExportAccessConfig,
//     configManagerExportAudit,
//     configManagerExportAuthentication,
//     configManagerExportAuthzPolicySets,
//     configManagerExportConnectorDefinitionsAll,
//     configManagerExportMappings,
//     configManagerExportCookieDomains,
//     configManagerExportCors,
//     configManagerExportEmailProviderConfiguration,
//     configManagerExportEmailTemplates,
//     configManagerExportEndpoints,
//     configManagerExportInternalRoles,
//     configManagerExportJourneys,
//     configManagerExportKbaConfig,
//     configManagerExportLocales,
//     configManagerExportManagedObjects,
//     configManagerExportConfigAgents,
//     configManagerExportOrgPrivileges,
//     configManagerExportPasswordPolicy,
//     configManagerExportRemoteServers,
//     configManagerExportSchedules,
//     configManagerExportSaml,
//     configManagerExportScripts,
//     configManagerExportSecrets,
//     configManagerExportSecretMappings,
//     configManagerExportServiceObjectsFromFile,
//     configManagerExportServices,
//     configManagerExportThemes,
//     configManagerExportTermsAndConditions,
//     configManagerExportUiConfig,
//     configManagerExportVariables,
//   ],
//   [CLASSIC_DEPLOYMENT_TYPE_KEY]: [
//     configManagerExportAccessConfig,
//     configManagerExportAudit,
//     configManagerExportAuthentication,
//     configManagerExportAuthzPolicySets,
//     configManagerExportConnectorDefinitionsAll,
//     configManagerExportMappings,
//     configManagerExportCookieDomains,
//     configManagerExportCors,
//     configManagerExportEmailProviderConfiguration,
//     configManagerExportEmailTemplates,
//     configManagerExportEndpoints,
//     configManagerExportInternalRoles,
//     configManagerExportJourneys,
//     configManagerExportKbaConfig,
//     configManagerExportLocales,
//     configManagerExportManagedObjects,
//     configManagerExportConfigAgents,
//     configManagerExportOrgPrivileges,
//     configManagerExportPasswordPolicy,
//     configManagerExportRemoteServers,
//     configManagerExportSchedules,
//     configManagerExportSaml,
//     configManagerExportScripts,
//     configManagerExportSecrets,
//     configManagerExportSecretMappings,
//     configManagerExportServiceObjectsFromFile,
//     configManagerExportServices,
//     configManagerExportThemes,
//     configManagerExportTermsAndConditions,
//     configManagerExportUiConfig,
//     configManagerExportVariables,
//   ],
// };

export interface ConfigManagerAllOptions {
  configFolder?: string;
  realm?: string;
}

export async function configManagerExportAllWithConfigFolder(
  options: ConfigManagerAllOptions = {}
): Promise<boolean> {
  const functions = deploymentMapAll[state.getDeploymentType()];
  for (const f of functions) {
    await f(options);
  }
  return true;
  // const batchSize = 8;

  // const results: PromiseSettledResult<boolean>[] = [];

  // for (let i = 0; i < functions.length; i += batchSize) {
  //   const batch = functions.slice(i, i + batchSize);

  //   const batchResults = await Promise.allSettled(
  //     batch.map((fn) => fn(options))
  //   );

  //   results.push(...batchResults);
  // }

  // return results.every(
  //   (result) => result.status === 'fulfilled' && result.value
  // );
}
//   try {
//     await configManagerExportAccessConfig();
//     await configManagerExportAudit();
//     await configManagerExportAuthentication(realm);

//     try {
//       await configManagerExportAuthzPolicySets(
//         `${options.configFolder}/authz-policies.json`
//       );
//     } catch (err) {
//       printError(
//         err,
//         'Error exporting Authz Policy Sets, Please make sure the config file name is authz-policies.json in the config folder.'
//       );
//     }

//     await configManagerExportConnectorDefinitionsAll();
//     await configManagerExportMappings();
//     await configManagerExportCookieDomains();
//     await configManagerExportCors();
//     await configManagerExportEmailProviderConfiguration();
//     await configManagerExportEmailTemplates();
//     await configManagerExportEndpoints();
//     await configManagerExportInternalRoles();
//     await configManagerExportJourneys(undefined, realm);
//     await configManagerExportKbaConfig();
//     await configManagerExportLocales();
//     await configManagerExportManagedObjects();

//     try {
//       await configManagerExportConfigAgents(
//         `${options.configFolder}/oauth2-agents.json`
//       );
//     } catch (err) {
//       printError(
//         err,
//         'Error exporting Oauth2 agents, Please make sure the config file name is oauth2-agents.json in the config folder.'
//       );
//     }

//     await configManagerExportOrgPrivileges();
//     await configManagerExportPasswordPolicy(realm);
//     await configManagerExportRemoteServers();
//     await configManagerExportSchedules();

//     try {
//       await configManagerExportSaml(`${options.configFolder}/saml.json`);
//     } catch (err) {
//       printError(
//         err,
//         'Error exporting SAML, Please make sure the config file name is saml.json in the config folder.'
//       );
//     }

//     await configManagerExportScripts();
//     await configManagerExportSecrets();
//     await configManagerExportSecretMappings(undefined, realm);

//     try {
//       await configManagerExportServiceObjectsFromFile(
//         `${options.configFolder}/service-objects.json`
//       );
//     } catch (err) {
//       printError(
//         err,
//         'Error exporting service objects, Please make sure the config file name is service-objects.json in the config folder.'
//       );
//     }

//     await configManagerExportServices(realm);
//     await configManagerExportThemes();
//     await configManagerExportTermsAndConditions();
//     await configManagerExportUiConfig();
//     await configManagerExportVariables();
//     return true;
//   } catch (error) {
//     printError(error, 'Error exporting all config files.');
//     return false;
//   }
// }

export async function configManagerExportAllStatic(
  realm?: string
): Promise<boolean> {
  try {
    await configManagerExportAccessConfig();
    await configManagerExportAudit();
    await configManagerExportAuthentication(realm);
    await configManagerExportConnectorDefinitionsAll();
    await configManagerExportMappings();

    await configManagerExportCors();
    await configManagerExportEmailProviderConfiguration();
    await configManagerExportEmailTemplates();
    await configManagerExportEndpoints();
    await configManagerExportJourneys(undefined, realm);

    await configManagerExportKbaConfig();
    await configManagerExportLocales();
    await configManagerExportManagedObjects();
    await configManagerExportOrgPrivileges();
    await configManagerExportPasswordPolicy(realm);

    await configManagerExportRemoteServers();
    await configManagerExportSchedules();
    await configManagerExportScripts();
    await configManagerExportServices(realm);
    await configManagerExportThemes();

    await configManagerExportTermsAndConditions();
    await configManagerExportUiConfig();

    return true;
  } catch (error) {
    printError(error, 'Error exporting all-static in fr-config-manager format');
    return false;
  }
}
