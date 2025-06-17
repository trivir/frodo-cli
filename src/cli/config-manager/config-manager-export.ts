import { FrodoStubCommand } from '../FrodoCommand';
import AccessConfig from './config-manager-export-access-config';
import Audit from './config-manager-export-audit';
import Authentication from './config-manager-export-authentication';
<<<<<<< HEAD
import AuthzPolicies from './config-manager-export-authz-policies';
import ConnectorDefinitions from './config-manager-export-connector-definitions';
import Mappings from './config-manager-export-connector-mappings';
import CookieDomains from './config-manager-export-cookie-domains';
import CORS from './config-manager-export-cors';
import CSP from './config-manager-export-csp';
import EmailProvider from './config-manager-export-email-provider';
=======
import CookieDomains from './config-manager-export-cookie-domains';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
import EmailTemplates from './config-manager-export-email-templates';
import Endpoints from './config-manager-export-endpoints';
import InternalRoles from './config-manager-export-internal-roles';
import Journeys from './config-manager-export-journeys';
import Kba from './config-manager-export-kba';
import Locales from './config-manager-export-locales';
<<<<<<< HEAD
import ManagedObject from './config-manager-export-managed-objects';
import Oauth2Agents from './config-manager-export-oauth2-agents';
import OrgPrivileges from './config-manager-export-org-privileges';
import PasswordPolicy from './config-manager-export-password-policy';
import RemoteServers from './config-manager-export-remote-servers';
import Schedules from './config-manager-export-schedules';
import Scripts from './config-manager-export-scripts';
import Secrets from './config-manager-export-secrets';
import Services from './config-manager-export-services';
import Terms from './config-manager-export-terms-and-conditions';
import Themes from './config-manager-export-themes';
import UiConfig from './config-manager-export-uiConfig';
import Variables from './config-manager-export-variables';
import Raw from './config-manager-export-raw';
=======
import ManagedObjects from './config-manager-export-managed-objects';
import ConnectorMappings from './config-manager-export-connector-mappings';
import ConnectorDefinitions from './config-manager-export-connector-definitions';
import Saml from './config-manager-export-saml';
import AuthzPolicies from './config-manager-export-authz-policies';
import CORS from './config-manager-export-cors';
import CSP from './config-manager-export-csp';
import EmailProvider from './config-manager-export-email-provider';
import Oauth2Agents from './config-manager-export-oauth2-agents';
import OrgPrivileges from './config-manager-export-org-privileges';
import PasswordPolicy from './config-manager-export-password-policy';
import Raw from './config-manager-export-raw';
import RemoteServers from './config-manager-export-remote-servers';
import Schedules from './config-manager-export-schedules';
import Scripts from './config-manager-export-scripts';
import SecretMappings from './config-manager-export-secret-mappings';
import Secrets from './config-manager-export-secrets';
import ServiceObjects from './config-manager-export-service-objects';
import Services from './config-manager-export-services';
import Terms from './config-manager-export-terms-and-conditions';
import Test from './config-manager-export-test';
import Themes from './config-manager-export-themes';
import UiConfig from './config-manager-export-uiConfig';
import Variables from './config-manager-export-variables';
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd

export default function setup() {
  const program = new FrodoStubCommand('config-manager export').description(
    'Export IDM configuration objects.'
  );
<<<<<<< HEAD

  program.addCommand(Secrets().name('secrets'));
  program.addCommand(Scripts().name('scripts'));
  program.addCommand(Services().name('services'));
  program.addCommand(Mappings().name('connector-mappings'));
  program.addCommand(Themes().name('themes'));
  program.addCommand(Variables().name('variables'));
  program.addCommand(Terms().name('terms-and-conditions'));
  program.addCommand(UiConfig().name('ui-config'));
  program.addCommand(AccessConfig().name('access-config'));
  program.addCommand(Audit().name('audit'));
  program.addCommand(Authentication().name('authentication'));
  program.addCommand(InternalRoles().name('internal-roles'));
  program.addCommand(Endpoints().name('endpoints'));
  program.addCommand(EmailTemplates().name('email-templates'));
  program.addCommand(Schedules().name('schedules'));
  program.addCommand(Kba().name('kba'));
=======
  program.addCommand(AccessConfig().name('access-config'));
  program.addCommand(Audit().name('audit'));
  program.addCommand(Authentication().name('authentication'));
  program.addCommand(AuthzPolicies().name('authz-policies'));

  program.addCommand(ConnectorDefinitions().name('connector-definitions'));
  program.addCommand(ConnectorMappings().name('connector-mappings'));
>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  program.addCommand(CookieDomains().name('cookie-domains'));
  program.addCommand(CORS().name('cors'));
  program.addCommand(CSP().name('csp'));
  program.addCommand(EmailProvider().name('email-provider'));
  program.addCommand(EmailTemplates().name('email-templates'));
  program.addCommand(Endpoints().name('endpoints'));
  program.addCommand(InternalRoles().name('internal-roles'));
  program.addCommand(Journeys().name('journeys'));
<<<<<<< HEAD
  program.addCommand(AuthzPolicies().name('authz-policies'));
  program.addCommand(ConnectorDefinitions().name('connector-definitions'));
  program.addCommand(CORS().name('cors'));
  program.addCommand(CSP().name('csp'));
  program.addCommand(EmailProvider().name('email-provider'));
  program.addCommand(OrgPrivileges().name('org-privileges'));
  program.addCommand(Oauth2Agents().name('oauth2-agents'));
  program.addCommand(Raw().name('raw'));
=======
  program.addCommand(Kba().name('kba'));
  program.addCommand(Locales().name('locales'));
  program.addCommand(ManagedObjects().name('managed-objects'));
  program.addCommand(Oauth2Agents().name('oauth2-agents'));
  program.addCommand(OrgPrivileges().name('org-privileges'));
  program.addCommand(PasswordPolicy().name('password-policy'));
  program.addCommand(Raw().name('raw'));
  program.addCommand(RemoteServers().name('remote-servers'));
  program.addCommand(Schedules().name('schedules'));
  program.addCommand(Saml().name('saml'));
  program.addCommand(Scripts().name('scripts'));
  program.addCommand(Secrets().name('secrets'));
  program.addCommand(SecretMappings().name('secret-mappings'));
  program.addCommand(ServiceObjects().name('service-objects'));
  program.addCommand(Services().name('services'));
  program.addCommand(Themes().name('themes'));
  program.addCommand(Terms().name('terms-and-conditions'));
  program.addCommand(Test().name('test'));
  program.addCommand(UiConfig().name('ui-config'));
  program.addCommand(Variables().name('variables'));

>>>>>>> 88ebe6cc737bef3d00f83b2ff8efe56d287dc5dd
  return program;
}
