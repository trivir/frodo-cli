import { frodo, state } from "@rockcarver/frodo-lib";

import { printError } from "../utils/Console";
import {
  configManagerExportAccessConfig,
  configManagerImportAccessConfig,
} from "./FrConfigAccessConfigOps";
import {
  configManagerExportAudit,
  configManagerImportAudit,
} from "./FrConfigAuditOps";
import {
  configManagerExportAuthentication,
  configManagerImportAuthentication,
} from "./FrConfigAuthenticationOps";
import {
  configManagerExportAuthzPolicySets,
  configManagerImportAuthzPolicies,
} from "./FrConfigAuthzPoliciesOps";
import {
  configManagerExportConnectorDefinitionsAll,
  configManagerImportConnectors,
} from "./FrConfigConnectorDefinitionsOps";
import {
  configManagerExportMappings,
  configManagerImportMappings,
} from "./FrConfigConnectorMappingOps";
import {
  configManagerExportCookieDomains,
  configManagerImportCookieDomains,
} from "./FrConfigCookieDomainsOps";
import {
  configManagerExportCors,
  configManagerImportCors,
} from "./FrConfigCorsOps";
import {
  configManagerExportCsp,
  configManagerImportCsp,
} from "./FrConfigCspOps";
import {
  configManagerExportCustomNodes,
  configManagerImportCustomNodes,
} from "./FrConfigCustomNodesOps";
import {
  configManagerExportEmailProviderConfiguration,
  configManagerImportEmailProvider,
} from "./FrConfigEmailProviderOps";
import {
  configManagerExportEmailTemplates,
  configManagerImportEmailTemplates,
} from "./FrConfigEmailTemplatesOps";
import {
  configManagerExportEndpoints,
  configManagerImportEndpoints,
} from "./FrConfigEndpointsOps";
import {
  configManagerExportInternalRoles,
  configManagerImportInternalRoles,
} from "./FrConfigInternalRolesOps";
import {
  configManagerExportJourneys,
  configManagerImportJourneys,
} from "./FrConfigJourneysOps";
import {
  configManagerExportKbaConfig,
  configManagerImportKbaConfig,
} from "./FrConfigKbaOps";
import {
  configManagerExportLocales,
  configManagerImportLocales,
} from "./FrConfigLocalesOps";
import {
  configManagerExportManagedObjects,
  configManagerImportManagedObjects,
} from "./FrConfigManagedObjectsOps";
import { configManagerExportConfigAgents } from "./FrConfigOauth2AgentOps";
import {
  configManagerExportOrgPrivileges,
  configManagerImportOrgPrivilegesAllRealms,
} from "./FrConfigOrgPrivilegesOps";
import {
  configManagerExportPasswordPolicy,
  configManagerImportPasswordPolicy,
} from "./FrConfigPasswordPolicyOps";
import {
  configManagerExportRaw,
  configManagerImportRaw,
} from "./FrConfigRawOps";
import {
  configManagerExportRemoteServers,
  configManagerImportRemoteServers,
} from "./FrConfigRemoteServersOps";
import { configManagerExportSaml } from "./FrConfigSamlOps";
import {
  configManagerExportSchedules,
  configManagerImportSchedules,
} from "./FrConfigSchedulesOps";
import { configManagerExportScripts } from "./FrConfigScriptOps";
import {
  configManagerExportSecretMappings,
  configManagerImportSecretMappings,
} from "./FrConfigSecretMappingsOps";
import {
  configManagerExportSecrets,
  configManagerImportSecrets,
} from "./FrConfigSecretOps";
import {
  configManagerExportServiceObjectsFromFile,
  configManagerImportServiceObjects,
} from "./FrConfigServiceObjectsOps";
import {
  configManagerExportServices,
  configManagerImportServices,
} from "./FrConfigServiceOps";
import {
  configManagerExportTelemetry,
  configManagerImportTelemetry,
} from "./FrConfigTelemetryOps";
import {
  configManagerExportTermsAndConditions,
  configManagerImportTermsAndConditions,
} from "./FrConfigTermsAndConditionsOps";
import {
  configManagerExportThemes,
  configManagerImportThemes,
} from "./FrConfigThemeOps";
import {
  configManagerExportUiConfig,
  configManagerImportUiConfig,
} from "./FrConfigUiConfigOps";
import {
  configManagerExportVariables,
  configManagerImportVariables,
} from "./FrConfigVariableOps";
import { TelemetryExporterCategory } from "@rockcarver/frodo-lib/types/api/cloud/TelemetryApi";

const {
  CLASSIC_DEPLOYMENT_TYPE_KEY,
  CLOUD_DEPLOYMENT_TYPE_KEY,
  FORGEOPS_DEPLOYMENT_TYPE_KEY,
} = frodo.utils.constants;

export interface ConfigManagerAllOptions {
  category: TelemetryExporterCategory;
  prune: boolean;
  stdin: boolean;
  path: string;
  dependencies: boolean;
  name?: string;
  configFolder?: string;
  realm?: string;
}

type ConfigManagerDeploymentFunction = (
  options: ConfigManagerAllOptions,
) => Promise<boolean>;

type ConfigManagerDeploymentMap = Record<
  string,
  ConfigManagerDeploymentFunction[]
>;

const exportDeploymentMapAll: ConfigManagerDeploymentMap = {
  [FORGEOPS_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerExportAccessConfig(),
    () => configManagerExportAudit(),
    (options) => configManagerExportAuthentication(options.realm),
    (options) =>
      configManagerExportAuthzPolicySets(
        `${options.configFolder}/authz-policies.json`,
      ),
    () => configManagerExportConnectorDefinitionsAll(),
    () => configManagerExportMappings(),
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
    (options) =>
      configManagerExportConfigAgents(
        `${options.configFolder}/oauth2-agents.json`,
      ),
    () => configManagerExportOrgPrivileges(),
    (options) => configManagerExportPasswordPolicy(options.realm),
    (options) => configManagerExportRaw(`${options.configFolder}/raw.json`),
    () => configManagerExportRemoteServers(),
    (options) => configManagerExportSaml(`${options.configFolder}/saml.json`),
    () => configManagerExportSchedules(),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) =>
      configManagerExportServiceObjectsFromFile(
        `${options.configFolder}/service-objects.json`,
      ),
    (options) => configManagerExportServices(options.realm),
    () => configManagerExportTermsAndConditions(),
    () => configManagerExportThemes(),
    () => configManagerExportUiConfig(),
  ],
  [CLOUD_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerExportAccessConfig(),
    () => configManagerExportAudit(),
    (options) => configManagerExportAuthentication(options.realm),
    (options) =>
      configManagerExportAuthzPolicySets(
        `${options.configFolder}/authz-policies.json`,
      ),
    () => configManagerExportConnectorDefinitionsAll(),
    () => configManagerExportMappings(),
    () => configManagerExportCookieDomains(),
    () => configManagerExportCors(),
    (options) =>
      configManagerExportCsp(`${options.configFolder}/csp-overrides.json`),
    () => configManagerExportCustomNodes(),
    () => configManagerExportEmailProviderConfiguration(),
    () => configManagerExportEmailTemplates(),
    () => configManagerExportEndpoints(),
    () => configManagerExportInternalRoles(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    () => configManagerExportKbaConfig(),
    () => configManagerExportLocales(),
    () => configManagerExportManagedObjects(),
    (options) =>
      configManagerExportConfigAgents(
        `${options.configFolder}/oauth2-agents.json`,
      ),
    () => configManagerExportOrgPrivileges(),
    (options) => configManagerExportPasswordPolicy(options.realm),
    (options) => configManagerExportRaw(`${options.configFolder}/raw.json`),
    () => configManagerExportRemoteServers(),
    (options) => configManagerExportSaml(`${options.configFolder}/saml.json`),
    () => configManagerExportSchedules(),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) => configManagerExportSecretMappings(undefined, options.realm),
    () => configManagerExportSecrets(),
    (options) =>
      configManagerExportServiceObjectsFromFile(
        `${options.configFolder}/service-objects.json`,
      ),
    (options) => configManagerExportServices(options.realm),
    () => configManagerExportTelemetry(),
    () => configManagerExportTermsAndConditions(),
    () => configManagerExportThemes(),
    () => configManagerExportUiConfig(),
    () => configManagerExportVariables(),
  ],
  [CLASSIC_DEPLOYMENT_TYPE_KEY]: [
    (options) => configManagerExportAuthentication(options.realm),
    (options) =>
      configManagerExportAuthzPolicySets(
        `${options.configFolder}/authz-policies.json`,
      ),
    () => configManagerExportCors(),
    () => configManagerExportCustomNodes(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    (options) =>
      configManagerExportConfigAgents(
        `${options.configFolder}/oauth2-agents.json`,
      ),
    (options) => configManagerExportRaw(`${options.configFolder}/raw.json`),
    (options) => configManagerExportSaml(`${options.configFolder}/saml.json`),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) => configManagerExportServices(options.realm),
  ],
};

const exportDeploymentMapAllStatic: ConfigManagerDeploymentMap = {
  [FORGEOPS_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerExportAccessConfig(),
    () => configManagerExportAudit(),
    (options) => configManagerExportAuthentication(options.realm),
    () => configManagerExportConnectorDefinitionsAll(),
    () => configManagerExportMappings(),
    () => configManagerExportCors(),
    () => configManagerExportCustomNodes(),
    () => configManagerExportEmailProviderConfiguration(),
    () => configManagerExportEmailTemplates(),
    () => configManagerExportEndpoints(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    () => configManagerExportKbaConfig(),
    () => configManagerExportLocales(),
    () => configManagerExportManagedObjects(),
    () => configManagerExportOrgPrivileges(),
    (options) => configManagerExportPasswordPolicy(options.realm),
    () => configManagerExportRemoteServers(),
    () => configManagerExportSchedules(),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) => configManagerExportServices(options.realm),
    () => configManagerExportTermsAndConditions(),
    () => configManagerExportThemes(),
    () => configManagerExportUiConfig(),
  ],
  [CLOUD_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerExportAccessConfig(),
    () => configManagerExportAudit(),
    (options) => configManagerExportAuthentication(options.realm),
    () => configManagerExportConnectorDefinitionsAll(),
    () => configManagerExportMappings(),
    () => configManagerExportCors(),
    () => configManagerExportCustomNodes(),
    () => configManagerExportEmailProviderConfiguration(),
    () => configManagerExportEmailTemplates(),
    () => configManagerExportEndpoints(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    () => configManagerExportKbaConfig(),
    () => configManagerExportLocales(),
    () => configManagerExportManagedObjects(),
    () => configManagerExportOrgPrivileges(),
    (options) => configManagerExportPasswordPolicy(options.realm),
    () => configManagerExportRemoteServers(),
    () => configManagerExportSchedules(),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) => configManagerExportSecretMappings(undefined, options.realm),
    (options) => configManagerExportServices(options.realm),
    () => configManagerExportTermsAndConditions(),
    () => configManagerExportThemes(),
    () => configManagerExportUiConfig(),
  ],
  [CLASSIC_DEPLOYMENT_TYPE_KEY]: [
    (options) => configManagerExportAuthentication(options.realm),
    () => configManagerExportCors(),
    () => configManagerExportCustomNodes(),
    (options) => configManagerExportJourneys(undefined, options.realm),
    (options) => configManagerExportScripts(undefined, options.realm),
    (options) => configManagerExportServices(options.realm),
  ],
};

const importDeploymentMapAll: ConfigManagerDeploymentMap = {
  [FORGEOPS_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerImportAccessConfig(),
    () => configManagerImportAudit(),
    (options) => configManagerImportAuthentication(options.realm),
    () => configManagerImportAuthzPolicies(),
    (options) => configManagerImportConnectors(options.name),
    (options) => configManagerImportMappings(options.name),
    () => configManagerImportCors(),
    (options) => configManagerImportCustomNodes(options.name),
    () => configManagerImportEmailProvider(),
    (options) => configManagerImportEmailTemplates(options.name),
    (options) => configManagerImportEndpoints(options.name),
    (options) => configManagerImportInternalRoles(options.name),
    (options) => configManagerImportJourneys(options.realm, options.name, options.dependencies),
    () => configManagerImportKbaConfig(),
    (options) => configManagerImportLocales(options.name),
    (options) => configManagerImportManagedObjects(options.name),
    () => configManagerImportOrgPrivilegesAllRealms(),
    (options) => configManagerImportPasswordPolicy(options.realm),
    (options) => configManagerImportRaw(options.path, options.stdin),
    () => configManagerImportRemoteServers(),
    (options) => configManagerImportSchedules(options.name),
    () => configManagerImportServiceObjects(),
    (options) => configManagerImportServices(options.name, options.realm),
    () => configManagerImportTermsAndConditions(),
    () => configManagerImportThemes(),
    () => configManagerImportUiConfig(),
  ],
  [CLOUD_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerImportAccessConfig(),
    () => configManagerImportAudit(),
    (options) => configManagerImportAuthentication(options.realm),
    () => configManagerImportAuthzPolicies(),
    (options) => configManagerImportConnectors(options.name),
    (options) => configManagerImportMappings(options.name),
    () => configManagerImportCookieDomains(),
    () => configManagerImportCors(),
    () => configManagerImportCsp(),
    (options) => configManagerImportCustomNodes(options.name),
    () => configManagerImportEmailProvider(),
    (options) => configManagerImportEmailTemplates(options.name),
    (options) => configManagerImportEndpoints(options.name),
    (options) => configManagerImportInternalRoles(options.name),
    (options) => configManagerImportJourneys(options.realm, options.name, options.dependencies),
    () => configManagerImportKbaConfig(),
    (options) => configManagerImportLocales(options.name),
    (options) => configManagerImportManagedObjects(options.name),
    () => configManagerImportOrgPrivilegesAllRealms(),
    (options) => configManagerImportPasswordPolicy(options.name),
    (options) => configManagerImportRaw(options.path, options.stdin),
    () => configManagerImportRemoteServers(),
    (options) => configManagerImportSchedules(options.name),
    (options) => configManagerImportSecretMappings(options.name, options.realm),
    (options) => configManagerImportSecrets(options.name, options.prune),
    () => configManagerImportServiceObjects(),
    (options) => configManagerImportServices(options.name, options.realm),
    (options) => configManagerImportTelemetry(options.category, options.name),
    () => configManagerImportTermsAndConditions(),
    () => configManagerImportThemes(),
    () => configManagerImportUiConfig(),
    (options) => configManagerImportVariables(options.name),
  ],
  [CLASSIC_DEPLOYMENT_TYPE_KEY]: [
    (options) => configManagerImportAuthentication(options.realm),
    () => configManagerImportAuthzPolicies(),
    () => configManagerImportCors(),
    (options) => configManagerImportCustomNodes(options.name),
    (options) => configManagerImportJourneys(options.realm, options.name, options.dependencies),
    (options) => configManagerImportRaw(options.path, options.stdin),
    (options) => configManagerImportServices(options.name, options.realm),
  ],
};

const importDeploymentMapAllStatic: ConfigManagerDeploymentMap = {
  [FORGEOPS_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerImportAccessConfig(),
    () => configManagerImportAudit(),
    (options) => configManagerImportAuthentication(options.realm),
    (options) => configManagerImportConnectors(options.realm),
    (options) => configManagerImportMappings(options.name),
    () => configManagerImportCors(),
    (options) => configManagerImportCustomNodes(options.name),
    () => configManagerImportEmailProvider(),
    (options) => configManagerImportEmailTemplates(options.name),
    (options) => configManagerImportEndpoints(options.name),
    (options) => configManagerImportJourneys(options.realm, options.name, options.dependencies),
    () => configManagerImportKbaConfig(),
    (options) => configManagerImportLocales(options.name),
    (options) => configManagerImportManagedObjects(options.name),
    () => configManagerImportOrgPrivilegesAllRealms(),
    (options) => configManagerImportPasswordPolicy(options.realm),
    () => configManagerImportRemoteServers(),
    (options) => configManagerImportSchedules(options.name),
    (options) => configManagerImportServices(options.name, options.realm),
    () => configManagerImportTermsAndConditions(),
    () => configManagerImportThemes(),
    () => configManagerImportUiConfig(),
  ],
  [CLOUD_DEPLOYMENT_TYPE_KEY]: [
    () => configManagerImportAccessConfig(),
    () => configManagerImportAudit(),
    (options) => configManagerImportAuthentication(options.realm),
    (options) => configManagerImportConnectors(options.name),
    (options) => configManagerImportMappings(options.name),
    () => configManagerImportCors(),
    (options) => configManagerImportCustomNodes(options.name),
    () => configManagerImportEmailProvider(),
    (options) => configManagerImportEmailTemplates(options.name),
    (options) => configManagerImportEndpoints(options.name),
    (options) => configManagerImportJourneys(options.realm, options.name, options.dependencies),
    () => configManagerImportKbaConfig(),
    (options) => configManagerImportLocales(options.name),
    (options) => configManagerImportManagedObjects(options.name),
    () => configManagerImportOrgPrivilegesAllRealms(),
    (options) => configManagerImportPasswordPolicy(options.realm),
    () => configManagerImportRemoteServers(),
    (options) => configManagerImportSchedules(options.name),
    (options) => configManagerImportSecretMappings(options.name, options.realm),
    (options) => configManagerImportServices(options.name, options.realm),
    () => configManagerImportTermsAndConditions(),
    () => configManagerImportThemes(),
    () => configManagerImportUiConfig(),
  ],
  [CLASSIC_DEPLOYMENT_TYPE_KEY]: [
    (options) => configManagerImportAuthentication(options.realm),
    () => configManagerImportCors(),
    (options) => configManagerImportCustomNodes(options.name),
    (options) => configManagerImportJourneys(options.realm, options.name, options.dependencies),
    (options) => configManagerImportServices(options.name, options.realm),
  ],
};

async function executeDeploymentMap(
  deploymentMap: ConfigManagerDeploymentMap,
  options: ConfigManagerAllOptions = {
    category: "otlp",
    prune: false,
    stdin: false,
    path: "",
    dependencies: false
  },
): Promise<void> {
  const deploymentType = state.getDeploymentType();

  if (!deploymentType) {
    throw new Error("Unable to determine the deployment type.");
  }

  const functions = deploymentMap[deploymentType];

  if (!functions) {
    throw new Error(`Unsupported deployment type: ${deploymentType}`);
  }

  for (const operation of functions) {
    await operation(options);
  }
}

export async function configManagerExportAllWithConfigFolder(
  options: ConfigManagerAllOptions = {
    category: "otlp",
    prune: false,
    stdin: false,
    path: "",
    dependencies: false
  },
): Promise<boolean> {
  try {
    await executeDeploymentMap(exportDeploymentMapAll, options);
    return true;
  } catch (error) {
    printError(error, "Error exporting all in fr-config-manager format");
    return false;
  }
}

export async function configManagerExportAllStatic(
  options: ConfigManagerAllOptions = {
    category: "otlp",
    prune: false,
    stdin: false,
    path: "",
    dependencies: false
  },
): Promise<boolean> {
  try {
    await executeDeploymentMap(exportDeploymentMapAllStatic, options);
    return true;
  } catch (error) {
    printError(error, "Error exporting all-static in fr-config-manager format");
    return false;
  }
}

export async function configManagerImportAll(): Promise<boolean> {
  try {
    await executeDeploymentMap(importDeploymentMapAll);
    return true;
  } catch (error) {
    printError(error, "Error importing all config files.");
    return false;
  }
}

export async function configManagerImportAllStatic(): Promise<boolean> {
  try {
    await executeDeploymentMap(importDeploymentMapAllStatic);
    return true;
  } catch (error) {
    printError(error, "Error importing all-static config files.");
    return false;
  }
}