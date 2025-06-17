import { FrodoStubCommand } from '../FrodoCommand';
import AccessConfig from './config-manager-export-access-config';
import Audit from './config-manager-export-audit';
import Authentication from './config-manager-export-authentication';
import CookieDomains from './config-manager-export-cookie-domains';
import EmailTemplates from './config-manager-export-email-templates';
import Endpoints from './config-manager-export-endpoints';
import InternalRoles from './config-manager-export-internal-roles';
import Journeys from './config-manager-export-journeys';
import Kba from './config-manager-export-kba';
import Locales from './config-manager-export-locales';
import ManagedObject from './config-manager-export-managed-objects';
import Mappings from './config-manager-export-mappings';
import PasswordPolicy from './config-manager-export-password-policy';
import RemoteServers from './config-manager-export-remote-servers';
import Saml from './config-manager-export-saml';
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
  program.addCommand(InternalRoles().name('internal-roles'));
  program.addCommand(Endpoints().name('endpoints'));
  program.addCommand(EmailTemplates().name('email-templates'));
  program.addCommand(Schedules().name('schedules'));
  program.addCommand(Kba().name('kba'));
  program.addCommand(CookieDomains().name('cookie-domains'));
  program.addCommand(RemoteServers().name('remote-servers'));
  program.addCommand(PasswordPolicy().name('password-policy'));
  program.addCommand(ManagedObject().name('managed-objects'));
  program.addCommand(Locales().name('locales'));
  program.addCommand(Journeys().name('journeys'));
  program.addCommand(ServiceObjects().name('service-objects'));
  program.addCommand(SecretMappings().name('secret-mappings'));
  program.addCommand(Saml().name('saml'));
  program.addCommand(Test().name('test'));

  return program;
}
