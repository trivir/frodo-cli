import { FrodoStubCommand } from '../FrodoCommand';
import AuthzPolicies from './config-manager-export-authz-policies';
import ConnectorDefinitions from './config-manager-export-connector-definitions';
import CORS from './config-manager-export-cors';
import CSP from './config-manager-export-csp';
import EmailProvider from './config-manager-export-email-provider';
import Mappings from './config-manager-export-mappings';
import Oauth2Agents from './config-manager-export-oauth2-agents';
import OrgPrivileges from './config-manager-export-org-privileges';
import Scripts from './config-manager-export-scripts';
import Secrets from './config-manager-export-secrets';
import Services from './config-manager-export-services';
import Terms from './config-manager-export-terms-and-conditions';
import Themes from './config-manager-export-themes';
import UiConfig from './config-manager-export-uiConfig';
import Variables from './config-manager-export-variables';
import AccessConfig from './config-manager-export-access-config';
import Audit from './config-manager-export-audit';
import Authentication from './config-manager-export-authentication';
import InternalRoles from './config-manager-export-internal-roles';
import Endpoints from './config-manager-export-endpoints';
import EmailTemplates from './config-manager-export-email-templates';
import Schedules from './config-manager-export-schedules'
import Kba from './config-manager-export-kba';
import CookieDomains from './config-manager-export-cookie-domains';
import RemoteServers from './config-manager-export-remote-servers';
import PasswordPolicy from './config-manager-export-password-policy';
import ManagedObject from './config-manager-export-managed-objects';
import Locales from './config-manager-export-locales'
import Journeys from './config-manager-export-journeys'

export default function setup() {
  const program = new FrodoStubCommand('config-manager export').description(
    'Export IDM configuration objects.'
  );

  program.addCommand(Secrets().name('secrets'));
  program.addCommand(Scripts().name('scripts'));
  program.addCommand(Services().name('services'));
  program.addCommand(Mappings().name('mappings'));
  program.addCommand(Themes().name('themes'));
  program.addCommand(Variables().name('variables'));
  program.addCommand(Terms().name('terms-and-conditions'));
  program.addCommand(UiConfig().name('ui-config'));
  program.addCommand(AccessConfig().name('access-config'));
  program.addCommand(Audit().name('audit'));
  program.addCommand(Authentication().name('authentication'));
  program.addCommand(InternalRoles().name('internal-roles')) ;
  program.addCommand(Endpoints().name('endpoints')) ;
  program.addCommand(EmailTemplates().name('email-templates')) ;
  program.addCommand(Schedules().name('schedules'));
  program.addCommand(Kba().name('kba'));
  program.addCommand(CookieDomains().name('cookie-domains'));
  program.addCommand(RemoteServers().name('remote-servers'));
  program.addCommand(PasswordPolicy().name('password-policy'));
  program.addCommand(ManagedObject().name('managed-objects'));
  program.addCommand(Locales().name('locales'));
  program.addCommand(Journeys().name('journeys'));
  program.addCommand(AuthzPolicies().name('authz-policies'));
  program.addCommand(ConnectorDefinitions().name('connector-definitions'));
  program.addCommand(CORS().name('cors'));
  program.addCommand(CSP().name('csp'));
  program.addCommand(EmailProvider().name('email-provider'));
  program.addCommand(OrgPrivileges().name('org-privileges'));
  program.addCommand(Oauth2Agents().name('oauth2-agents'));
  return program;
}
