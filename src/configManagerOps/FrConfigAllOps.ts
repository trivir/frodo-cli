import { frodo } from '@rockcarver/frodo-lib';
import { getIdmImportExportOptions } from '../ops/IdmOps';
import { printError } from '../utils/Console';
import { configManagerExportJourneys } from './FrConfigJourneysOps';
import { configManagerExportAccessConfig } from './FrConfigAccessConfigOps';
import { configManagerExportAudit } from './FrConfigAuditOps';
import { configManagerExportAuthentication } from './FrConfigAuthenticationOps';
import { configManagerExportAuthzPoliciesAll, configManagerExportAuthzPolicySets } from './FrConfigAuthzPoliciesOps';
import { configManagerExportConnectorDefinitionsAll } from './FrConfigConnectorDefinitionsOps';
import { configManagerExportMappings } from './FrConfigConnectorMappingOps';
import { configManagerExportCookieDomains } from './FrConfigCookieDomainsOps';
import { configManagerExportCors } from './FrConfigCorsOps';
import { configManagerExportCsp } from './FrConfigCspOps';
import { configManagerExportEmailProviderConfiguration } from './FrConfigEmailProviderOps';
import { configManagerExportEmailTemplates } from './FrConfigEmailTemplatesOps';
import { configManagerExportEndpoints } from './FrConfigEndpointsOps';
import { configManagerExportInternalRoles } from './FrConfigInternalRolesOps';
import { configManagerExportKbaConfig } from './FrConfigKbaOps';
import { configManagerExportLocales } from './FrConfigLocalesOps';
import { configManagerExportManagedObjects } from './FrConfigManagedObjectsOps';
import { configManagerExportConfigAgents } from './FrConfigOauth2AgentOps';
import { configManagerExportOrgPrivilegesAllRealms } from './FrConfigOrgPrivilegesOps';
import { configManagerExportPasswordPolicy } from './FrConfigPasswordPolicyOps';
import { configManagerExportRemoteServers } from './FrConfigRemoteServersOps';
import { configManagerExportSchedules } from './FrConfigSchedulesOps';
import { configManagerExportSaml } from './FrConfigSamlOps';
import { configManagerExportScript, configManagerExportScriptsAll } from './FrConfigScriptOps';
import { configManagerExportSecrets } from './FrConfigSecretOps';
import { configManagerExportSecretMappings } from './FrConfigSecretMappingsOps';
import { configManagerExportServiceObject, configManagerExportServiceObjectsFromFile } from './FrConfigServiceObjectsOps';
import { configManagerExportServices } from './FrConfigServiceOps';
import { configManagerExportThemes } from './FrConfigThemeOps';
import { configManagerExportTermsAndConditions } from './FrConfigTermsAndConditionsOps';
import { configManagerExportUiConfig } from './FrConfigUiConfigOps';
import { configManagerExportVariables } from './FrConfigVariableOps';

const COMMAND = {
  ALL: "all",
  ALL_STATIC: "all-static",
  JOURNEYS: "journeys",
  CONNECTOR_DEFINITIONS: "connector-definitions",
  CONNECTOR_MAPPINGS: "connector-mappings",
  COOKIE_DOMAINS: "cookie-domains",
  CORS: "cors",
  CSP: "csp",
  MANAGED_OBJECTS: "managed-objects",
  EMAIL_TEMPLATES: "email-templates",
  EMAIL_PROVIDER: "email-provider",
  THEMES: "themes",
  REMOTE_SERVERS: "remote-servers",
  SCRIPTS: "scripts",
  SERVICES: "services",
  AUTHENTICATION: "authentication",
  TERMS_AND_CONDITIONS: "terms-and-conditions",
  PASSWORD_POLICY: "password-policy",
  UI_CONFIG: "ui-config",
  IDM_ENDPOINTS: "endpoints",
  IDM_SCHEDULES: "schedules",
  IDM_ACCESS_CONFIG: "access-config",
  KBA: "kba",
  INTERNAL_ROLES: "internal-roles",
  SECRETS: "secrets",
  ESVS: "variables",
  SECRET_MAPPINGS: "secret-mappings",
  OAUTH2_AGENTS: "oauth2-agents",
  AUTHZ_POLICIES: "authz-policies",
  SERVICE_OBJECTS: "service-objects",
  LOCALES: "locales",
  AUDIT: "audit",
  CONFIG_METADATA: "config-metadata",
  VERSION: "version",
  TEST: "test",
  ORG_PRIVILEGES: "org-privileges",
  RAW: "raw",
  SAML: "saml",
};
const COMMAND_MAP = {
  "all": [ //27
    COMMAND.JOURNEYS,
    COMMAND.CONNECTOR_DEFINITIONS,
    COMMAND.CONNECTOR_MAPPINGS,
    COMMAND.COOKIE_DOMAINS,
    COMMAND.CORS,

    COMMAND.MANAGED_OBJECTS,
    COMMAND.EMAIL_TEMPLATES,
    COMMAND.EMAIL_PROVIDER,
    COMMAND.THEMES,
    COMMAND.REMOTE_SERVERS,

    COMMAND.SCRIPTS,
    COMMAND.SERVICES,
    COMMAND.AUTHENTICATION,
    COMMAND.TERMS_AND_CONDITIONS,
    COMMAND.PASSWORD_POLICY,

    COMMAND.UI_CONFIG,
    COMMAND.IDM_ENDPOINTS,
    COMMAND.IDM_SCHEDULES,
    COMMAND.IDM_ACCESS_CONFIG,
    COMMAND.KBA,

    COMMAND.INTERNAL_ROLES,
    COMMAND.SECRETS,
    COMMAND.ESVS,
    COMMAND.SECRET_MAPPINGS,
    COMMAND.OAUTH2_AGENTS,

    COMMAND.AUTHZ_POLICIES,
    COMMAND.SERVICE_OBJECTS,
    COMMAND.LOCALES,
    COMMAND.AUDIT,
    COMMAND.ORG_PRIVILEGES,

    COMMAND.SAML,
  ],
  "all-static": [ //22
    COMMAND.JOURNEYS,
    COMMAND.CONNECTOR_DEFINITIONS,
    COMMAND.CONNECTOR_MAPPINGS,
    COMMAND.CORS,
    COMMAND.MANAGED_OBJECTS,

    COMMAND.EMAIL_TEMPLATES,
    COMMAND.EMAIL_PROVIDER,
    COMMAND.THEMES,
    COMMAND.REMOTE_SERVERS,
    COMMAND.SCRIPTS,

    COMMAND.SERVICES,
    COMMAND.AUTHENTICATION,
    COMMAND.TERMS_AND_CONDITIONS,
    COMMAND.PASSWORD_POLICY,
    COMMAND.UI_CONFIG,

    COMMAND.IDM_ENDPOINTS,
    COMMAND.IDM_SCHEDULES,
    COMMAND.IDM_ACCESS_CONFIG,
    COMMAND.KBA,
    COMMAND.LOCALES,

    COMMAND.AUDIT,
    COMMAND.ORG_PRIVILEGES,
  ],
};
export interface ConfigManagerAllOptions {
  all?: boolean;
  realm?: string
  configFolder?: string;
}

export async function configManagerExportAllWithConfigFolder(
  options: ConfigManagerAllOptions = {}
  ):Promise<boolean>{
  
  try{
    await configManagerExportAccessConfig()
    await configManagerExportAudit()
    await configManagerExportAuthentication()

  try {
    await configManagerExportAuthzPolicySets(`${options.configFolder}/authz-policies.json`);
  } catch (err) {
    printError(err, 'Error exporting Authz Policy Sets, Please make sure the config file name is authz-policies.json in the config folder.');
  }
  
    await configManagerExportConnectorDefinitionsAll()
    await configManagerExportMappings()
    await configManagerExportCookieDomains()
    await configManagerExportCors()
    await configManagerExportEmailProviderConfiguration()
    await configManagerExportEmailTemplates()
    await configManagerExportEndpoints()
    await configManagerExportInternalRoles()
    await configManagerExportJourneys();
    await configManagerExportKbaConfig()
    await configManagerExportLocales()
    await configManagerExportManagedObjects()

    try{
      await configManagerExportConfigAgents(`${options.configFolder}/oauth2-agents.json`)
    } catch (err) {
      printError(err, 'Error exporting Oauth2 agents, Please make sure the config file name is oauth2-agents.json in the config folder.');
    }

    await configManagerExportOrgPrivilegesAllRealms()
    await configManagerExportPasswordPolicy()
    await configManagerExportRemoteServers()
    await configManagerExportSchedules()

    try{
      await configManagerExportSaml(`${options.configFolder}/saml.json`)
    } catch (err) {
      printError(err, 'Error exporting SAML, Please make sure the config file name is saml.json in the config folder.');
    }

    await configManagerExportScriptsAll()
    await configManagerExportSecrets()
    await configManagerExportSecretMappings()

    try{
      await configManagerExportServiceObjectsFromFile(`${options.configFolder}/service-objects.json`)
    } catch (err) {
      printError(err, 'Error exporting service objects, Please make sure the config file name is service-objects.json in the config folder.');
    }(options.configFolder)

    await configManagerExportServices()
    await configManagerExportThemes()
    await configManagerExportTermsAndConditions()
    await configManagerExportUiConfig()
    await configManagerExportVariables()
    return true
  }
  catch (error){
    printError(error,'Error exporting all config files.')
    return false
  }
}


export async function configManagerExportAllStatic():Promise<boolean>{
  try{
    await configManagerExportAccessConfig()
    await configManagerExportAudit()
    await configManagerExportAuthentication()
    await configManagerExportConnectorDefinitionsAll()
    await configManagerExportMappings()

    await configManagerExportCors()
    await configManagerExportEmailProviderConfiguration()
    await configManagerExportEmailTemplates()
    await configManagerExportEndpoints()
    await configManagerExportJourneys()

    await configManagerExportKbaConfig()
    await configManagerExportLocales()
    await configManagerExportManagedObjects()
    await configManagerExportOrgPrivilegesAllRealms()
    await configManagerExportPasswordPolicy()

    await configManagerExportRemoteServers()
    await configManagerExportSchedules()
    await configManagerExportScriptsAll()
    await configManagerExportServices()
    await configManagerExportThemes()

    await configManagerExportTermsAndConditions()
    await configManagerExportUiConfig()

    return true
  }
  catch (error){
    printError(error, 'Error exporting all-static in fr-config-manager format')
    return false
  }
}