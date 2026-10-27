import { FrodoStubCommand } from '../../FrodoCommand';
import CheckPromotionReports from './config-manager-promote-check-promotion-reports';
import CheckPromotionStatus from './config-manager-promote-check-promotion-status';
import LockTenants from './config-manager-promote-lock-tenants';
import UnlockTenants from './config-manager-promote-unlock-tenants';

export default function setup() {
  const program = new FrodoStubCommand('promote').description(
    'Promote configuration optimized for CI/CD pipelines (format compatible with fr-config-manager).'
  );
  program.addCommand(CheckPromotionStatus().name('check-promotion-status'));
  program.addCommand(CheckPromotionReports().name('check-promotion-reports'));
  program.addCommand(LockTenants().name('lock-tenants'));
  program.addCommand(UnlockTenants().name('unlock-tenants'));
  return program;
}
